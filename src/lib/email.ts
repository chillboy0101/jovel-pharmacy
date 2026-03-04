import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export type NotificationType = 'ORDER_CONFIRMED' | 'ORDER_SHIPPED' | 'ORDER_DELIVERED' | 'ORDER_CANCELLED';

export async function sendReceiptEmail(order: any, type: NotificationType = 'ORDER_DELIVERED') {
  const itemsList = order.items.map((item: any) => 
    `<li><strong>${item.product.emoji} ${item.product.name}</strong> (x${item.quantity}): $${(item.price * item.quantity).toFixed(2)}</li>`
  ).join('');

  const subjects: Record<NotificationType, string> = {
    ORDER_CONFIRMED: `Order Confirmed - #${order.id.slice(0, 8).toUpperCase()}`,
    ORDER_SHIPPED: `Your Order is on its way! - #${order.id.slice(0, 8).toUpperCase()}`,
    ORDER_DELIVERED: `Order Delivered - #${order.id.slice(0, 8).toUpperCase()}`,
    ORDER_CANCELLED: `Order Cancelled - #${order.id.slice(0, 8).toUpperCase()}`,
  };

  const messages: Record<NotificationType, string> = {
    ORDER_CONFIRMED: `Thank you for your order! We've received it and are starting to process it.`,
    ORDER_SHIPPED: `Great news! Your order has been shipped and is on its way to you.`,
    ORDER_DELIVERED: `Your order has been delivered! We hope you enjoy your purchase.`,
    ORDER_CANCELLED: `Your order has been cancelled. If you have any questions, please contact support.`,
  };

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #10b981; text-align: center;">Jovel Pharmacy</h2>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p>Hi ${order.firstName || 'Customer'},</p>
      <p>${messages[type]}</p>
      
      <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; font-size: 14px; color: #6b7280; text-transform: uppercase;">Order Summary</h3>
        <p style="margin: 5px 0;"><strong>Order ID:</strong> #${order.id.toUpperCase()}</p>
        <p style="margin: 5px 0;"><strong>Status:</strong> ${order.status.toUpperCase()}</p>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
      </div>

      <h3 style="font-size: 16px;">Items</h3>
      <ul style="padding-left: 20px; margin: 0;">
        ${itemsList}
      </ul>

      <div style="margin-top: 20px; text-align: right; border-top: 1px solid #eee; padding-top: 15px;">
        <p style="margin: 5px 0; color: #6b7280;">Shipping: $${order.shipping.toFixed(2)}</p>
        <p style="margin: 5px 0; font-size: 18px;"><strong>Total Paid: $${order.total.toFixed(2)}</strong></p>
      </div>

      <div style="margin-top: 20px; padding: 15px; background: #fffbeb; border-radius: 8px;">
        <h3 style="margin-top: 0; font-size: 14px; color: #92400e; text-transform: uppercase;">Delivery Address</h3>
        <p style="margin: 0; color: #92400e;">
          ${order.address || 'N/A'}<br />
          ${order.city || ''}, ${order.state || ''} ${order.zip || ''}<br />
          ${order.country || ''}
        </p>
      </div>

      <div style="margin-top: 30px; text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/account/orders/${order.id}" 
           style="background: #10b981; color: white; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold;">
           Track Your Order
        </a>
      </div>

      <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="font-size: 12px; color: #9ca3af; text-align: center;">
        If you have any questions, please contact us at support@jovelpharmacy.com.<br />
        &copy; ${new Date().getFullYear()} Jovel Pharmacy. All rights reserved.
      </p>
    </div>
  `;

  if (resend) {
    try {
      await resend.emails.send({
        from: 'Jovel Pharmacy <onboarding@resend.dev>', // Replace with your verified domain
        to: order.email,
        subject: subjects[type],
        html: html,
      });
      return true;
    } catch (err) {
      console.error("[sendReceiptEmail] Resend error:", err);
      return false;
    }
  }

  // Fallback to console log if API key missing
  console.log(`--- MOCK EMAIL: ${type} ---`);
  console.log(`To: ${order.email}`);
  console.log(`Subject: ${subjects[type]}`);
  console.log("---------------------------");
  
  return true;
}
