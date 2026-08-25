const thankq = [
  "Thanks", "Thank You", "Thanks..", "Thank You..",
  "Thank You so much for Considering", "Thank a lot",
  "Thanks for considering", "Thank You...", "Thanks....", "Thanks ..",
  "Thank you so much ... ",
];

export const replacePlaceholders = (text, contact) => {
  if (!text) return "";
  return text
    .replace(/{first_name}/g, contact.firstName || "")
    .replace(/{last_name}/g, contact.lastName || "")
    .replace(/{firstName}/g, contact.firstName || "")
    .replace(/{lastName}/g, contact.lastName || "")
    .replace(/{company_name}/g, contact.companyName || contact.companyNameForEmails || "")
    .replace(/{companyName}/g, contact.companyName || contact.companyNameForEmails || "")
    .replace(/{companyNameForEmails}/g, contact.companyNameForEmails || contact.companyName || "")
    .replace(/{title}/g, contact.title || "")
    .replace(/{city}/g, contact.city || "")
    .replace(/{state}/g, contact.state || "")
    .replace(/{country}/g, contact.country || "")
    .replace(/{website}/g, contact.website || "")
    .replace(/{industry}/g, contact.industry || "");
};

export const formatEmailContent = (greeting, body, signature, contact) => {
  const defaultGreeting = "Hii {first_name} {last_name}";
  let formattedGreeting = replacePlaceholders(greeting || defaultGreeting, contact);
  let formattedBody = replacePlaceholders(body || "", contact);
  let formattedSignature = replacePlaceholders(signature || "Thank You", contact);
  
  const hasThankYou = thankq.some(t => formattedSignature.toLowerCase().includes(t.toLowerCase())) || 
                     formattedSignature.toLowerCase().includes("thank");
  
  if (!hasThankYou) {
    const randomThank = thankq[Math.floor(Math.random() * thankq.length)];
    formattedSignature = `${randomThank}\n\n${formattedSignature}`;
  }

  return `${formattedGreeting},\n\n${formattedBody}\n\n${formattedSignature}`;
};
