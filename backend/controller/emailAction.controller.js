import Contact from "../models/Contacts.js";
import { generateInternshipEmail } from "../ai-service/groqservice.js";
import { formate } from "../email-service/email.body.format.js";
import { sendEmailsNodemailer } from "../email-service/index.js";
import { isBlockedDomain } from "../utils/blockedDomains.js";

const thankq = [
  "Thanks", "Thank You", "Thanks..", "Thank You..",
  "Thank You so much for Considering", "Thank a lot",
  "Thanks for considering", "Thank You...", "Thanks....", "Thanks ..",
  "Thank you so much ... ",
];

// POST /api/emails/send - send email to specific contacts
export const sendToContacts = async (req, res) => {
  try {
    const { contactIds } = req.body;
    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ success: false, error: "contactIds array required" });
    }

    const contacts = await Contact.find({
      _id: { $in: contactIds },
      "flags.doNotContact": { $ne: true },
      "flags.bounced": { $ne: true },
      "flags.unsubscribe": { $ne: true },
    });

    const results = { sent: [], failed: [], skipped: [] };

    for (const contact of contacts) {
      // Block sending to restricted domains
      if (isBlockedDomain(contact.email)) {
        results.skipped.push({ id: contact._id, email: contact.email, reason: "Blocked domain" });
        continue;
      }

      try {
        const random = Math.floor(Math.random() * thankq.length);
        const { subject, body } = await generateInternshipEmail(contact);
        const bdy = await formate(body, contact, thankq[random]);

        const { seccess } = await sendEmailsNodemailer({ subject, bdy }, contact.email);

        if (seccess) {
          await Contact.findByIdAndUpdate(contact._id, {
            $set: {
              lastSentDate: new Date(),
              outreachStatus: contact.outreachStatus === "NOT_SENT" ? "SENT" : contact.outreachStatus,
            },
            $inc: { "emailStats.emailsSent": 1 },
            $push: { emails: { type: "outreach", subject, sentAt: new Date() } },
          });
          results.sent.push({ id: contact._id, email: contact.email });
        } else {
          results.failed.push({ id: contact._id, email: contact.email });
        }

        // Rate limit between emails
        if (contacts.length > 1) {
          await new Promise((resolve) => setTimeout(resolve, 15000));
        }
      } catch (err) {
        results.failed.push({ id: contact._id, email: contact.email, error: err.message });
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error("sendToContacts error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/emails/followup - send followup to specific contacts
export const sendFollowup = async (req, res) => {
  try {
    const { contactIds } = req.body;
    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ success: false, error: "contactIds array required" });
    }

    const contacts = await Contact.find({
      _id: { $in: contactIds },
      "flags.doNotContact": { $ne: true },
      "flags.bounced": { $ne: true },
      "flags.unsubscribe": { $ne: true },
      "followup.followupEnabled": true,
      $expr: { $lt: ["$followup.followupCount", "$followup.maxFollowups"] },
    });

    const results = { sent: [], failed: [], skipped: [] };

    for (const contact of contacts) {
      // Block sending to restricted domains
      if (isBlockedDomain(contact.email)) {
        results.skipped.push({ id: contact._id, email: contact.email, reason: "Blocked domain" });
        continue;
      }

      try {
        const random = Math.floor(Math.random() * thankq.length);
        const { subject, body } = await generateInternshipEmail(contact);
        const bdy = await formate(body, contact, thankq[random]);

        const { seccess } = await sendEmailsNodemailer(
          { subject: `Re: ${subject}`, bdy },
          contact.email
        );

        if (seccess) {
          await Contact.findByIdAndUpdate(contact._id, {
            $set: {
              lastSentDate: new Date(),
              outreachStatus: "FOLLOWUP_PENDING",
              "followup.nextFollowupAt": new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            },
            $inc: {
              "followup.followupCount": 1,
              "emailStats.emailsSent": 1,
            },
            $push: { emails: { type: "followup", subject: `Re: ${subject}`, sentAt: new Date() } },
          });
          results.sent.push({ id: contact._id, email: contact.email });
        } else {
          results.failed.push({ id: contact._id, email: contact.email });
        }

        if (contacts.length > 1) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      } catch (err) {
        results.failed.push({ id: contact._id, email: contact.email, error: err.message });
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error("sendFollowup error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
