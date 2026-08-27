import cron from "node-cron";
import Contact from "../models/Contacts.js";
import Batch from "../models/Batch.js";
import Sequence from "../models/Sequence.js";
import { sendEmailsNodemailer } from "../email-service/index.js";
import { isContactBlockedFromEmails } from "../utils/emailFilters.js";
import { getOrInitializeSettings } from "../controller/settings.controller.js";
import { formatEmailContent, replacePlaceholders } from "../utils/emailPlaceholder.js";

export const runDailyScheduler = async () => {
  console.log("⏰ Daily scheduler execution started...");
  try {
    const settings = await getOrInitializeSettings();
    if (settings.emailsSentToday >= settings.maxEmailsPerDay) {
      console.log(`⚠️ Daily email limit of ${settings.maxEmailsPerDay} reached. Skipping today's run.`);
      return;
    }

    // Get today's date end
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Find contacts who have a next_send_date <= todayEnd
    const eligibleContacts = await Contact.find({
      next_send_date: { $lte: todayEnd },
      next_send_type: { $in: ["email", "followup"] },
      batch_id: { $ne: null },
      sequence_id: { $ne: null }
    }).populate("sequence_id batch_id");

    console.log(`📊 Found ${eligibleContacts.length} contacts scheduled for sending.`);

    let sentCount = 0;

    for (const contact of eligibleContacts) {
      if (settings.emailsSentToday >= settings.maxEmailsPerDay) {
        console.log("⚠️ Daily email limit reached during run. Skipping remaining contacts.");
        break;
      }

      // Check contact flags
      const checkBlocked = isContactBlockedFromEmails(contact);
      if (checkBlocked.blocked) {
        console.log(`⏭️ Skipping contact ${contact.email} - ${checkBlocked.reason}`);
        contact.next_send_date = null;
        contact.next_send_type = null;
        contact.batch_id = null;
        contact.sequence_id = null;
        await contact.save();
        continue;
      }

      const batch = contact.batch_id;
      const sequence = contact.sequence_id;

      // Skip if batch is not active (paused) or if sequence status is stopped/paused
      if (!batch || batch.status !== "active" || !sequence || sequence.status !== "active") {
        console.log(`⏭️ Skipping contact ${contact.email} - Batch/Sequence is paused or inactive.`);
        continue;
      }

      const nextType = contact.next_send_type;

      try {
        let emailSubject = "";
        let emailText = "";

        const rawSubject = sequence.subject || `${sequence.name}`;
        const resolvedSubject = replacePlaceholders(rawSubject, contact);

        if (nextType === "email") {
          emailSubject = resolvedSubject;
          emailText = formatEmailContent(sequence.greeting, sequence.body, sequence.signature, contact);
        } else if (nextType === "followup") {
          emailSubject = resolvedSubject.toLowerCase().startsWith("re:") ? resolvedSubject : `Re: ${resolvedSubject}`;
          emailText = formatEmailContent(sequence.followupGreeting, sequence.followupBody, sequence.followupSignature, contact);
        }

        const { seccess, error } = await sendEmailsNodemailer({ subject: emailSubject, bdy: emailText }, contact.email);

        if (seccess) {
          const now = new Date();
          contact.lastSentDate = now;
          contact.outreachStatus = nextType === "email" ? "SENT" : "FOLLOWUP_PENDING";
          contact.emailStats.emailsSent += 1;
          contact.emails.push({
            type: nextType === "email" ? "outreach" : "followup",
            subject: emailSubject,
            sentAt: now
          });

          // Determine next step
          const emailsSentTotal = contact.emailStats.emailsSent; // total sent including this one
          const nextFollowupIndex = emailsSentTotal - 1; // since index 0 is first followup

          if (batch.follow_up_dates && batch.follow_up_dates.length > nextFollowupIndex) {
            contact.next_send_date = batch.follow_up_dates[nextFollowupIndex];
            contact.next_send_type = "followup";
          } else {
            // No more followups, clear schedule state
            contact.next_send_date = null;
            contact.next_send_type = null;
            contact.batch_id = null;
            contact.sequence_id = null;
          }

          await contact.save();

          // Auto-disable batch if no more active contacts remain
          const activeContactsCount = await Contact.countDocuments({
            batch_id: batch._id,
            next_send_date: { $ne: null }
          });
          if (activeContactsCount === 0) {
            batch.status = "paused";
            await batch.save();
            console.log(`ℹ️ Batch "${batch.name || batch._id}" reached its last follow-up and is now disabled.`);
          }

          settings.emailsSentToday += 1;
          await settings.save();
          sentCount++;
          console.log(`✅ Sent ${nextType} to ${contact.email}`);

          // Delay
          const delaySec = Math.floor(Math.random() * (settings.maxDelaySeconds - settings.minDelaySeconds + 1)) + settings.minDelaySeconds;
          await new Promise((resolve) => setTimeout(resolve, delaySec * 1000));
        } else {
          // Nodemailer bounce
          contact.next_send_date = null;
          contact.next_send_type = null;
          contact.batch_id = null;
          contact.sequence_id = null;
          contact.flags.bounced = true;
          contact.outreachStatus = "NO_RESPONSE";
          await contact.save();
          console.log(`❌ Sending failed for ${contact.email} (marked bounced): ${error || "Unknown error"}`);
        }
      } catch (err) {
        console.error(`💥 Error processing email to ${contact.email}:`, err);
        contact.next_send_date = null;
        contact.next_send_type = null;
        contact.batch_id = null;
        contact.sequence_id = null;
        contact.flags.bounced = true;
        await contact.save();
      }
    }

    console.log(`🏁 Daily scheduler run complete. Sent ${sentCount} emails.`);
  } catch (error) {
    console.error("❌ Scheduler error:", error);
  }
};

export const startScheduler = () => {
  // Run every day at 9:00 AM
  cron.schedule("0 9 * * *", async () => {
    await runDailyScheduler();
  });
  console.log("⏰ Cron daily scheduler registered for 9:00 AM.");

  // Run once on startup to process any missed/pending emails immediately
  console.log("⏰ Running initial startup scheduler check...");
  runDailyScheduler().catch(err => {
    console.error("❌ Error running startup scheduler check:", err);
  });
};
