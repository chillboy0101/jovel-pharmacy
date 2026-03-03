export async function sendReceiptEmail(order: any) {
  // Since this is a mock implementation for now (no real SMTP provider like Resend/SendGrid/Nodemailer configured),
  // we'll log the receipt to the console. In a real app, this is where you'd call your email service.
  
  const itemsList = order.items.map((item: any) => 
    `- ${item.product.emoji} ${item.product.name} (x${item.quantity}): $${(item.price * item.quantity).toFixed(2)}`
  ).join('\n');

  const receipt = `
    📧 EMAIL SENT TO: ${order.email}
    SUBJECT: Your Jovel Pharmacy Receipt - Order #${order.id.slice(0, 8).toUpperCase()}
    
    Hi ${order.firstName || 'Customer'},
    
    Your order has been delivered! Thank you for shopping with Jovel Pharmacy.
    
    --- ORDER SUMMARY ---
    Order ID: ${order.id}
    Date: ${new Date(order.createdAt).toLocaleDateString()}
    
    ITEMS:
    ${itemsList}
    
    Shipping: $${order.shipping.toFixed(2)}
    Total Paid: $${order.total.toFixed(2)}
    
    DELIVERY ADDRESS:
    ${order.address}
    ${order.city}, ${order.state} ${order.zip}
    ${order.country}
    
    If you have any questions, please contact us at support@jovelpharmacy.com.
    
    Stay healthy,
    The Jovel Pharmacy Team
  `;

  console.log("--- MOCK EMAIL RECEIPT ---");
  console.log(receipt);
  console.log("---------------------------");
  
  return true;
}
