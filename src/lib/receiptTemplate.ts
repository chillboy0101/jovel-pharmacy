export type ReceiptTemplateItem = {
  quantity: number;
  price: number;
  product: {
    name: string;
    emoji: string;
    imageUrl?: string | null;
  };
};

export type ReceiptTemplateOrder = {
  id: string;
  firstName?: string | null;
  status: string;
  createdAt: string | Date;
  shipping: number;
  total: number;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  items: ReceiptTemplateItem[];
};

export type ReceiptTemplateNotificationType =
  | "ORDER_CONFIRMED"
  | "ORDER_SHIPPED"
  | "ORDER_DELIVERED"
  | "ORDER_CANCELLED";

export function buildReceiptEmailHtml(params: {
  order: ReceiptTemplateOrder;
  type?: ReceiptTemplateNotificationType;
  baseUrl: string;
}) {
  const { order } = params;
  const type = params.type ?? "ORDER_DELIVERED";

  const includeItems = type !== "ORDER_CANCELLED";
  const normalizeAddressPart = (value?: string | null) => {
    const v = (value ?? "").trim();
    if (!v) return "";
    const upper = v.toUpperCase();
    if (upper === "N/A" || upper === "NA") return "";
    return v;
  };

  const addressLine1 = normalizeAddressPart(order.address);
  const addressLine2 = [order.city, order.state, order.zip]
    .map(normalizeAddressPart)
    .filter(Boolean)
    .join(", ");
  const addressLine3 = normalizeAddressPart(order.country);
  const addressHtml = [addressLine1, addressLine2, addressLine3].filter(Boolean).join("<br />");

  const isInStorePickup = normalizeAddressPart(order.state).toLowerCase() === "in_store";

  const itemsList = includeItems
    ? order.items
        .map(
          (item) =>
            `<li style="margin: 10px 0;">
              <div style="display: flex; align-items: center; gap: 10px;">
                ${
                  item.product.imageUrl
                    ? `<img src="${item.product.imageUrl}" alt="${item.product.name}" width="36" height="36" style="display:block; border-radius: 8px; border: 1px solid #e5e7eb; object-fit: contain;" />`
                    : `<span style="font-size: 20px; line-height: 1;">${item.product.emoji}</span>`
                }
                <div style="flex: 1; min-width: 0;">
                  <div style="font-weight: 700; color: #111827;">${item.product.name}</div>
                  <div style="font-size: 12px; color: #6b7280;">Qty: ${item.quantity}</div>
                </div>
                <div style="font-weight: 700; color: #111827; white-space: nowrap;">GH₵${(
                  item.price * item.quantity
                ).toFixed(2)}</div>
              </div>
            </li>`,
        )
        .join("")
    : "";

  const messages: Record<ReceiptTemplateNotificationType, string> = {
    ORDER_CONFIRMED: `Thank you for your order! We've received it and are starting to process it.`,
    ORDER_SHIPPED: `Great news! Your order has been shipped and is on its way to you.`,
    ORDER_DELIVERED: `Your order has been delivered! We hope you enjoy your purchase.`,
    ORDER_CANCELLED: `Your order has been cancelled. If you have any questions, please contact support.`,
  };

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #10b981; text-align: center;">Jovel Pharmacy</h2>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p>Hi ${order.firstName || "Customer"},</p>
      <p>${messages[type]}</p>
      
      <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; font-size: 14px; color: #6b7280; text-transform: uppercase;">Order Summary</h3>
        <p style="margin: 5px 0;"><strong>Order ID:</strong> #${order.id.toUpperCase()}</p>
        <p style="margin: 5px 0;"><strong>Status:</strong> ${order.status.toUpperCase()}</p>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
      </div>

      ${
        includeItems
          ? `
        <h3 style="font-size: 16px;">Items</h3>
        <ul style="padding-left: 20px; margin: 0;">
          ${itemsList}
        </ul>
      `
          : ""
      }

      <div style="margin-top: 20px; text-align: right; border-top: 1px solid #eee; padding-top: 15px;">
        <p style="margin: 5px 0; color: #6b7280;">Shipping: GH₵${order.shipping.toFixed(2)}</p>
        <p style="margin: 5px 0; font-size: 18px;"><strong>Total Paid: GH₵${order.total.toFixed(2)}</strong></p>
      </div>

      <div style="margin-top: 20px; padding: 15px; background: #fffbeb; border-radius: 8px;">
        <h3 style="margin-top: 0; font-size: 14px; color: #92400e; text-transform: uppercase;">Delivery Address</h3>
        <p style="margin: 0; color: #92400e;">
          ${isInStorePickup ? "In-store pickup" : addressHtml || "Delivery address not provided"}
        </p>
      </div>

      <div style="margin-top: 30px; text-align: center;">
        <a href="${params.baseUrl}/account/orders/${order.id}" 
           style="background: #10b981; color: white; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold;">
           Track Your Order
        </a>
      </div>

      <p style="margin-top: 30px; text-align: center; color: #9ca3af; font-size: 12px;">
        Jovel Pharmacy - Your Community Pharmacy, Where Service Counts
      </p>

      <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="font-size: 12px; color: #9ca3af; text-align: center;">
        If you have any questions, please contact us at support@jovelpharmacy.com.<br />
        &copy; ${new Date().getFullYear()} Jovel Pharmacy. All rights reserved.
      </p>
    </div>
  `;

  return html;
}
