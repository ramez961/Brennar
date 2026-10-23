// Order notifications to the store owner's personal email, sent through Gmail
// SMTP with an app password. Configured via environment variables:
//   GMAIL_USER         Gmail address used to sign in to SMTP
//   GMAIL_APP_PASSWORD 16-character app password (Google Account → Security)
//   STORE_OWNER_EMAIL  where order notifications are sent (defaults to GMAIL_USER)
// When the credentials are absent, order emails are skipped with a log line so
// the storefront and dashboard keep working.

export const mailConfigured=()=>Boolean(process.env.GMAIL_USER&&process.env.GMAIL_APP_PASSWORD);

export async function sendOrderEmail(order){
  if(!mailConfigured()){console.log('Order email skipped: Gmail credentials not configured.');return;}
  const user=process.env.GMAIL_USER;
  const nodemailer=(await import('nodemailer')).default;
  const transporter=nodemailer.createTransport({host:'smtp.gmail.com',port:465,secure:true,auth:{user,pass:process.env.GMAIL_APP_PASSWORD}});
  const lines=[
    `New order ${order.id}`,
    '',
    `Customer: ${order.customer.name}`,
    `Phone: ${order.customer.phone}`,
    `Address: ${order.customer.address}`,
    ...(order.customer.notes?[`Note: ${order.customer.notes}`]:[]),
    '',
    ...order.items.map(item=>`${item.qty} × ${item.name}${item.option?` (${item.option})`:''} — $${(item.qty*item.price).toFixed(2)}`),
    '',
    `Total: $${order.total.toFixed(2)}`
  ];
  await transporter.sendMail({
    from:`Brennar store <${user}>`,
    to:process.env.STORE_OWNER_EMAIL||user,
    subject:`New order ${order.id} — ${order.customer.name} ($${order.total.toFixed(2)})`,
    text:lines.join('\n')
  });
}
