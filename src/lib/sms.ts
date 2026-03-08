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

  if (!apiKey || !sender) {
    const sms = `\n    📱 SMS SENT TO: ${recipient}\n    MESSAGE: ${message}\n  `;
    console.log("--- MOCK SMS NOTIFICATION ---");
    console.log(sms);
    console.log("-----------------------------");
    return true;
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
    return true;
  } catch (err) {
    console.error("[sendSMSNotification] Brevo SMS error:", err);
    return false;
  }
}
