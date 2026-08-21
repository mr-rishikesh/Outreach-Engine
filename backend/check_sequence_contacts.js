import mongoose from "mongoose";
import Sequence from "./models/Sequence.js";
import Contact from "./models/Contacts.js";
import dotenv from "dotenv";

dotenv.config();

const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/outreach-crm";

async function check() {
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");

  const seq = await Sequence.findOne({ name: "Rishikesh Kumar Yadav" }).populate("contacts.contactId");
  if (!seq) {
    console.log("❌ Sequence 'Rishikesh Kumar Yadav' not found!");
    // List all sequences so we see if the name is slightly different
    const allSeqs = await Sequence.find({}, { name: 1 });
    console.log("Available sequences:", allSeqs.map(s => s.name));
    await mongoose.disconnect();
    return;
  }

  console.log(`\n=== INSPECTING SEQUENCE: ${seq.name} ===`);
  console.log(`Status: ${seq.status}`);
  console.log(`Max Followups: ${seq.maxFollowups}`);
  console.log(`Followup Days: ${seq.followupDays}`);
  console.log(`Has Followup Body: ${!!seq.followupBody}`);
  console.log(`Contacts count: ${seq.contacts.length}`);

  const now = new Date();
  const delayDaysAgo = new Date();
  delayDaysAgo.setDate(delayDaysAgo.getDate() - seq.followupDays);
  console.log(`Current Time (now): ${now.toISOString()}`);
  console.log(`Cut-off for Follow-up (delayDaysAgo): ${delayDaysAgo.toISOString()}\n`);

  seq.contacts.forEach((sc, index) => {
    console.log(`Contact #${index + 1}:`);
    if (!sc.contactId) {
      console.log(`  ❌ Missing contactId reference! (status in sequence: ${sc.status})`);
      return;
    }
    const contact = sc.contactId;
    console.log(`  Name: ${contact.firstName} ${contact.lastName}`);
    console.log(`  Email: ${contact.email}`);
    console.log(`  Sequence Contact Status: "${sc.status}"`);
    console.log(`  Sequence Last Sent Date: ${sc.lastSentDate ? sc.lastSentDate.toISOString() : "null"}`);
    console.log(`  Sequence Followup Count: ${sc.followupCount}`);
    console.log(`  Contact Flags: doNotContact=${!!contact.flags?.doNotContact}, bounced=${!!contact.flags?.bounced}, unsubscribe=${!!contact.flags?.unsubscribe}`);
    console.log(`  Contact Outreach Status: "${contact.outreachStatus}"`);
    console.log(`  Contact Replied: ${!!contact.reply?.replied}`);
    console.log(`  Contact Active Sequence ID: ${contact.activeSequenceId}`);

    // Dry-run eligibility checks
    let eligible = false;
    let skipReason = "";

    if (sc.status === "removed") {
      skipReason = "Removed from sequence";
    } else if (contact.reply?.replied || contact.outreachStatus === "REPLIED_POSITIVE" || contact.outreachStatus === "REPLIED_NEGATIVE" || sc.status === "replied") {
      skipReason = "Marked as Replied";
    } else if (contact.flags?.doNotContact || contact.flags?.bounced || contact.flags?.unsubscribe) {
      skipReason = "Contact has flags (doNotContact / bounced / unsubscribe)";
    } else if (sc.status === "pending") {
      eligible = true;
    } else if (sc.status === "sent" || sc.status === "followup_pending") {
      if (!sc.lastSentDate) {
        skipReason = "Status is sent/followup_pending but lastSentDate is null/missing";
      } else {
        const lastSent = new Date(sc.lastSentDate);
        const timeDiff = lastSent - delayDaysAgo;
        if (lastSent > delayDaysAgo) {
          const hoursRemaining = ((lastSent - delayDaysAgo) / (1000 * 60 * 60)).toFixed(1);
          skipReason = `Delay of ${seq.followupDays} days has not passed yet. Needs to wait another ${hoursRemaining} hours.`;
        } else if (sc.followupCount >= seq.maxFollowups) {
          skipReason = `Max follow-ups reached (${sc.followupCount}/${seq.maxFollowups})`;
        } else if (!seq.followupBody) {
          skipReason = "No follow-up body template configured for the sequence";
        } else {
          eligible = true;
        }
      }
    } else {
      skipReason = `Unknown sequence contact status "${sc.status}"`;
    }

    if (eligible) {
      console.log("  👉 ELIGIBLE for sending!");
    } else {
      console.log(`  ❌ NOT ELIGIBLE: ${skipReason}`);
    }
    console.log("");
  });

  await mongoose.disconnect();
}

check().catch(console.error);
