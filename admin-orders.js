// Orders inbox for the store studio. Reads the server's /api/orders JSON API
// (customer name, phone, address, items) and is unlocked with the dashboard
// passcode, which is kept in sessionStorage for this browser session only.

const ORDERS_PASS_KEY='brennar-orders-pass';
let ordersList=[];
const ordersPass=()=>sessionStorage.getItem(ORDERS_PASS_KEY)||'';
async function ordersFetch(path,options={}){
  const response=await fetch(path,{...options,headers:{'Content-Type':'application/json','x-dashboard-passcode':ordersPass(),...(options.headers||{})}});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw Object.assign(new Error(data.error||'Request failed.'),{status:response.status});
  return data;
}
function showGate(){$('#orders-gate').hidden=false;$('#orders-content').hidden=true;}
function showOrders(){$('#orders-gate').hidden=true;$('#orders-content').hidden=false;}
async function loadOrders(){
  if(!ordersPass()){showGate();return;}
  try{
    const data=await ordersFetch('/api/orders');
    ordersList=data.orders;
    showOrders();
    renderOrders();
    status(ordersList.length+' order'+(ordersList.length===1?'':'s')+' · '+ordersList.filter(o=>o.status==='new').length+' new.');
  }catch(err){
    if(err.status===401){sessionStorage.removeItem(ORDERS_PASS_KEY);showGate();$('#orders-gate-error').textContent='Wrong passcode. Try again.';}
    else if(err.status===503){showGate();$('#orders-gate-error').textContent='The dashboard passcode is not configured on the server yet. Set DASHBOARD_PASSCODE in the store secrets and it will work here.';}
    else status('Orders could not load: '+err.message);
  }
}
function renderOrders(){
  const term=$('#orders-search').value.trim().toLowerCase(),filter=$('#orders-status-filter').value;
  const list=ordersList.filter(o=>(!filter||o.status===filter)&&`${o.id} ${o.customer.name} ${o.customer.phone} ${o.customer.address}`.toLowerCase().includes(term)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  $('#orders-empty').hidden=!!list.length;
  $('#order-rows').innerHTML=list.map(o=>`<tr><td><strong>${e(o.id)}</strong><br><small>${e(new Date(o.createdAt).toLocaleString())}</small></td><td>${e(o.customer.name)}</td><td>${e(o.customer.phone)}</td><td>${e(o.customer.address)}${o.customer.notes?`<br><small>${e(o.customer.notes)}</small>`:''}</td><td class="order-items">${o.items.map(i=>e(i.qty+' × '+i.name+(i.option?' ('+i.option+')':''))).join('<br>')}</td><td>${money(o.total)}</td><td><span class="status-pill ${o.status}">${o.status.toUpperCase()}</span></td><td>${o.status==='new'?`<button data-set-status="${e(o.id)}" data-next="fulfilled">Fulfilled</button><button data-set-status="${e(o.id)}" data-next="cancelled">Cancel</button>`:`<button data-set-status="${e(o.id)}" data-next="new">Reopen</button>`}</td></tr>`).join('');
}
$('#orders-unlock').onsubmit=async event=>{event.preventDefault();sessionStorage.setItem(ORDERS_PASS_KEY,$('#orders-passcode').value);$('#orders-gate-error').textContent='';await loadOrders();};
$('#orders-search').oninput=renderOrders;
$('#orders-status-filter').onchange=renderOrders;
$('#orders-refresh').onclick=loadOrders;
$('#order-rows').onclick=async event=>{
  const button=event.target.closest('[data-set-status]');
  if(!button)return;
  try{
    const data=await ordersFetch('/api/orders/status',{method:'POST',body:JSON.stringify({id:button.dataset.setStatus,status:button.dataset.next})});
    const index=ordersList.findIndex(o=>o.id===data.order.id);
    if(index>=0)ordersList[index]=data.order;
    renderOrders();
    status('Order '+data.order.id+' marked '+data.order.status+'.');
  }catch(err){status('Update failed: '+err.message);}
};
document.querySelector('[data-panel="orders"]').addEventListener('click',loadOrders);
