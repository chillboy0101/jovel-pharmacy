export async function sendSMSNotification(phone: string, message: string) {
  if (!phone) return false;

  const sms = `
    📱 SMS SENT TO: ${phone}
    MESSAGE: ${message}
  `;

  console.log("--- MOCK SMS NOTIFICATION ---");
  console.log(sms);
  console.log("-----------------------------");

  return true;
}
