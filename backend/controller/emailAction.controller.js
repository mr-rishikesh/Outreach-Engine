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
    const totalContacts = contacts.length;
    let processed = 0;

    console.log(`\n📧 Starting email campaign...`);
    console.log(`📊 Total contacts to process: ${totalContacts}`);
    console.log(`⏱️  Rate limit: 15 seconds between emails\n`);

    const startTime = Date.now();

    for (const contact of contacts) {
      // Block sending to restricted domains
      if (isBlockedDomain(contact.email)) {
        results.skipped.push({ id: contact._id, email: contact.email, reason: "Blocked domain" });
        processed++;
        console.log(`⏭️  SKIPPED [${processed}/${totalContacts}] - ${contact.email} (Blocked domain)`);
        continue;
      }

      try {
        const random = Math.floor(Math.random() * thankq.length);
        const { subject, body } = await generateInternshipEmail(contact);
        const bdy = await formate(body, contact, thankq[random]);

        const { seccess } = await sendEmailsNodemailer({ subject, bdy }, contact.email);

        if (seccess) {
          // Set lastSentDate to today
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          await Contact.findByIdAndUpdate(contact._id, {
            $set: {
              lastSentDate: today,
              outreachStatus: contact.outreachStatus === "NOT_SENT" ? "SENT" : contact.outreachStatus,
            },
            $inc: { "emailStats.emailsSent": 1 },
            $push: { emails: { type: "outreach", subject, sentAt: new Date() } },
          });

          processed++;
          const elapsed = Math.round((Date.now() - startTime) / 1000);
          console.log(`✅ SENT [${processed}/${totalContacts}] - ${contact.email} (${elapsed}s elapsed)`);
          results.sent.push({ id: contact._id, email: contact.email });
        } else {
          // Mark as bounced if email sending failed
          await Contact.findByIdAndUpdate(contact._id, {
            $set: {
              "flags.bounced": true,
              outreachStatus: "NO_RESPONSE",
            },
          });

          processed++;
          const elapsed = Math.round((Date.now() - startTime) / 1000);
          console.log(`❌ FAILED [${processed}/${totalContacts}] - ${contact.email} (${elapsed}s elapsed) - Marked as BOUNCED`);
          results.failed.push({ id: contact._id, email: contact.email });
        }

        // Rate limit between emails
        if (contacts.length > 1 && processed < totalContacts) {
          console.log(`⏳ Waiting 15 seconds before next email...\n`);
          await new Promise((resolve) => setTimeout(resolve, 10000));
        }
      } catch (err) {
        // Mark as bounced if error occurs
        await Contact.findByIdAndUpdate(contact._id, {
          $set: {
            "flags.bounced": true,
            outreachStatus: "NO_RESPONSE",
          },
        });

        processed++;
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        console.log(`❌ ERROR [${processed}/${totalContacts}] - ${contact.email}: ${err.message} (${elapsed}s elapsed) - Marked as BOUNCED`);
        results.failed.push({ id: contact._id, email: contact.email, error: err.message });
      }
    }

    const totalTime = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n✨ Campaign Complete! (Total time: ${totalTime}s)`);
    console.log(`📈 Summary: ${results.sent.length} sent | ${results.failed.length} failed | ${results.skipped.length} skipped\n`);

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
    const totalContacts = contacts.length;
    let processed = 0;

    console.log(`\n📧 Starting follow-up campaign...`);
    console.log(`📊 Total contacts to process: ${totalContacts}`);
    console.log(`⏱️  Rate limit: 5 seconds between follow-ups\n`);

    const startTime = Date.now();

    for (const contact of contacts) {
      // Block sending to restricted domains
      if (isBlockedDomain(contact.email)) {
        results.skipped.push({ id: contact._id, email: contact.email, reason: "Blocked domain" });
        processed++;
        console.log(`⏭️  SKIPPED [${processed}/${totalContacts}] - ${contact.email} (Blocked domain)`);
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
          // Set lastSentDate to today
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          // Schedule next follow-up 3 days from now
          const nextFollowup = new Date();
          nextFollowup.setDate(nextFollowup.getDate() + 3);
          nextFollowup.setHours(0, 0, 0, 0);

          await Contact.findByIdAndUpdate(contact._id, {
            $set: {
              lastSentDate: today,
              outreachStatus: "FOLLOWUP_PENDING",
              "followup.nextFollowupAt": nextFollowup,
            },
            $inc: {
              "followup.followupCount": 1,
              "emailStats.emailsSent": 1,
            },
            $push: { emails: { type: "followup", subject: `Re: ${subject}`, sentAt: new Date() } },
          });

          processed++;
          const elapsed = Math.round((Date.now() - startTime) / 1000);
          console.log(`✅ SENT [${processed}/${totalContacts}] - ${contact.email} (Follow-up #${contact.followup?.followupCount || 1}, ${elapsed}s elapsed)`);
          results.sent.push({ id: contact._id, email: contact.email });
        } else {
          // Mark as bounced if follow-up email sending failed
          await Contact.findByIdAndUpdate(contact._id, {
            $set: {
              "flags.bounced": true,
              outreachStatus: "NO_RESPONSE",
            },
          });

          processed++;
          const elapsed = Math.round((Date.now() - startTime) / 1000);
          console.log(`❌ FAILED [${processed}/${totalContacts}] - ${contact.email} (${elapsed}s elapsed) - Marked as BOUNCED`);
          results.failed.push({ id: contact._id, email: contact.email });
        }

        if (contacts.length > 1 && processed < totalContacts) {
          console.log(`⏳ Waiting 5 seconds before next follow-up...\n`);
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      } catch (err) {
        // Mark as bounced if error occurs
        await Contact.findByIdAndUpdate(contact._id, {
          $set: {
            "flags.bounced": true,
            outreachStatus: "NO_RESPONSE",
          },
        });

        processed++;
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        console.log(`❌ ERROR [${processed}/${totalContacts}] - ${contact.email}: ${err.message} (${elapsed}s elapsed) - Marked as BOUNCED`);
        results.failed.push({ id: contact._id, email: contact.email, error: err.message });
      }
    }

    const totalTime = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n✨ Follow-up Campaign Complete! (Total time: ${totalTime}s)`);
    console.log(`📈 Summary: ${results.sent.length} sent | ${results.failed.length} failed | ${results.skipped.length} skipped\n`);

    res.json({ success: true, results });
  } catch (error) {
    console.error("sendFollowup error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
