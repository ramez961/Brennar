import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {handleApi} from './api.mjs';
import {brotliCompressSync,gzipSync} from 'node:zlib';
const root=resolve('.');
const pages=new Set(['index.html','admin.html','style.css','collections.css','admin.css','app.js','admin.js','admin-orders.js','catalog.js']);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp'};
const cache=new Map();
async function asset(file){
  const info=await stat(file);
  let entry=cache.get(file);
  if(entry&&entry.modified===info.mtimeMs&&entry.size===info.size)return entry;
  const raw=await readFile(file);
  const compressible=['.html','.css','.js','.svg'].includes(extname(file));
  entry={modified:info.mtimeMs,size:info.size,hash:createHash('sha256').update(raw).digest('hex').slice(0,20),raw};
  if(compressible){entry.br=brotliCompressSync(raw);entry.gzip=gzipSync(raw);}
  cache.set(file,entry);
  return entry;
}
http.createServer(async(req,res)=>{
  try{
    const requestPath=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(requestPath.startsWith('/api/')){await handleApi(req,res);return;}
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'}).end();return;}
    const relative=requestPath==='/'?'index.html':requestPath.slice(1);
    if(!pages.has(relative)&&!/^assets\/[a-zA-Z0-9_-]+\.(png|jpe?g|webp|svg)$/.test(relative)){res.writeHead(404).end('Not found');return;}
    const file=resolve(root,relative);
    if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}
    const entry=await asset(file);
    const accepted=req.headers['accept-encoding']??'';
    const accepts=type=>accepted.split(',').some(value=>{const[name,...params]=value.trim().split(';');return name===type&&!params.some(p=>/^q\s*=\s*0(?:\.0*)?$/.test(p.trim()));});
    const encoding=entry.br&&accepts('br')?'br':entry.gzip&&accepts('gzip')?'gzip':'identity';
    const etag='"'+entry.hash+'-'+encoding+'"';
    const headers={'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':extname(file)==='.webp'?'public, max-age=86400, must-revalidate':'no-cache','ETag':etag,'Vary':'Accept-Encoding','X-Content-Type-Options':'nosniff'};
    if(req.headers['if-none-match']?.split(',').map(x=>x.trim()).includes(etag)){res.writeHead(304,headers).end();return;}
    const body=encoding==='identity'?entry.raw:entry[encoding];
    if(encoding!=='identity')headers['Content-Encoding']=encoding;
    headers['Content-Length']=body.length;
    res.writeHead(200,headers).end(req.method==='HEAD'?undefined:body);
  }catch{res.writeHead(404).end('Not found');}
}).listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));
