import {createHash,timingSafeEqual} from 'node:crypto';
import {addOrder,listOrders,updateStatus} from './orders.mjs';
import {sendOrderEmail} from './mail.mjs';

const json=(res,status,body)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}).end(JSON.stringify(body));};
const clean=(value,max)=>typeof value==='string'?value.trim().slice(0,max):'';
const passcodeConfigured=()=>Boolean(process.env.DASHBOARD_PASSCODE);
const authorized=req=>{
  const expected=createHash('sha256').update(process.env.DASHBOARD_PASSCODE??'').digest();
  const given=createHash('sha256').update(String(req.headers['x-dashboard-passcode']??'')).digest();
  return timingSafeEqual(expected,given);
};
async function readBody(req){
  const chunks=[];let size=0;
  for await(const chunk of req){size+=chunk.length;if(size>100*1024)throw new Error('too-large');chunks.push(chunk);}
  return JSON.parse(Buffer.concat(chunks).toString()||'{}');
}
export async function handleApi(req,res){
  try{
    const {pathname}=new URL(req.url,'http://localhost');
    if(req.method==='POST'&&pathname==='/api/orders'){
      const body=await readBody(req);
      const name=clean(body.name,100),phone=clean(body.phone,40),address=clean(body.address,500),notes=clean(body.notes,300);
      if(!name||phone.length<4||address.length<5)return json(res,400,{error:'Please provide your name, a phone number, and a delivery address.'});
      if(!Array.isArray(body.items)||!body.items.length||body.items.length>50)return json(res,400,{error:'Your bag is empty.'});
      const items=body.items.map(item=>({name:clean(item?.name,100)||'Item',option:clean(item?.option,50),qty:Math.min(99,Math.max(1,Number(item?.qty)||1)),price:Math.min(1000000,Math.max(0,Number(item?.price)||0))}));
      const order=await addOrder({name,phone,address,notes},items);
      sendOrderEmail(order).catch(err=>console.error('Order email failed:',err.message));
      return json(res,201,{id:order.id});
    }
    if(pathname==='/api/orders'||pathname==='/api/orders/status'){
      if(!passcodeConfigured())return json(res,503,{error:'not-configured'});
      if(!authorized(req))return json(res,401,{error:'wrong-passcode'});
      if(req.method==='GET'&&pathname==='/api/orders')return json(res,200,{orders:await listOrders()});
      if(req.method==='POST'&&pathname==='/api/orders/status'){
        const body=await readBody(req);
        const id=clean(body.id,20),status=clean(body.status,20);
        if(!['new','fulfilled','cancelled'].includes(status))return json(res,400,{error:'Invalid status.'});
        const order=await updateStatus(id,status);
        return order?json(res,200,{order}):json(res,404,{error:'Order not found.'});
      }
    }
    return json(res,404,{error:'Not found'});
  }catch(err){
    if(err.message==='too-large')return json(res,413,{error:'Order is too large.'});
    return json(res,400,{error:'Invalid request.'});
  }
}
