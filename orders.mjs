import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';

// Orders live in a single JSON file. ORDERS_FILE (set by the environment) points
// at a writable path outside the source tree; the fallback keeps local
// `npm start` runs working (orders.json is gitignored).
const file=resolve(process.env.ORDERS_FILE||'orders.json');
let cache=null;

async function load(){
  if(cache)return cache;
  try{cache=JSON.parse(await readFile(file,'utf8'));}catch{cache=[];}
  if(!Array.isArray(cache))cache=[];
  return cache;
}
async function persist(orders){
  await mkdir(dirname(file),{recursive:true});
  const temp=file+'.tmp';
  await writeFile(temp,JSON.stringify(orders,null,2));
  await rename(temp,file);
}
export async function listOrders(){return structuredClone(await load());}
export async function addOrder(customer,items){
  const orders=await load();
  const total=Math.round(items.reduce((sum,x)=>sum+x.qty*x.price,0)*100)/100;
  const nextNumber=orders.reduce((max,o)=>Math.max(max,Number(o.id.split('-')[1])||1000),1000)+1;
  const order={id:'BR-'+nextNumber,createdAt:new Date().toISOString(),status:'new',customer,items,total};
  orders.push(order);cache=orders;
  await persist(orders);
  return structuredClone(order);
}
export async function updateStatus(id,status){
  const orders=await load();
  const order=orders.find(o=>o.id===id);
  if(!order)return null;
  order.status=status;
  await persist(orders);
  return structuredClone(order);
}
