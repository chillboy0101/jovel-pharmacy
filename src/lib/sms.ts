function normalizeRecipient(input: string) {
  const raw = (input || "").trim();
  if (!raw) return "";
  if (raw.startsWith("+")) return raw;
  const digits = raw.replace(/\D+/g, "");
  if (!digits) return "";
  return digits.startsWith("0") ? `+233${digits.slice(1)}` : `+${digits}`;
}

export async function sendSMSNotification(phone: string, message: string) {
  const recipient = normalizeRecipient(phone);
  if (!recipient) return false;

  const apiKey = process.env.BREVO_SMS_API_KEY;
  const sender = process.env.BREVO_SMS_SENDER;
  const allowMock = process.env.ALLOW_MOCK_SMS === "true";

  if (!apiKey || !sender) {
    if (allowMock) {
      const sms = `\n    📱 MOCK SMS TO: ${recipient}\n    MESSAGE: ${message}\n  `;
      console.log("--- MOCK SMS NOTIFICATION (ALLOW_MOCK_SMS=true) ---");
      console.log(sms);
      console.log("-------------------------------------------------");
      return true;
    }
    console.warn(
      "[sendSMSNotification] SMS not configured. Set BREVO_SMS_API_KEY and BREVO_SMS_SENDER (or ALLOW_MOCK_SMS=true for dev).",
    );
    return false;
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender,
        recipient,
        content: message,
        type: "transactional",
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[sendSMSNotification] Brevo SMS failed:", res.status, text);
      return false;
    }

    const payloadText = await res.text().catch(() => "");
    if (payloadText) {
      console.log("[sendSMSNotification] Brevo SMS ok:", payloadText);
    }
    return true;
  } catch (err) {
    console.error("[sendSMSNotification] Brevo SMS error:", err);
    return false;
  }
}
