import mongoose from "mongoose";
import Sequence from "./models/Sequence.js";
import Contact from "./models/Contacts.js";
import dotenv from "dotenv";

dotenv.config();

const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/outreach-crm";

async function setup() {
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");

  // Find Test Campaign 1 sequence
  const seq = await Sequence.findOne({ name: "Rishikesh Kumar Yadav" });
  if (!seq) {
    console.error("Sequence not found!");
    await mongoose.disconnect();
    return;
  }

  // Update sequence fields to enable follow-ups
  seq.maxFollowups = 2;
  seq.followupDays = 3;

  // Set Brad Halsey to 'sent' and lastSentDate to 4 days ago
  const fourDaysAgo = new Date();
  fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

  let contactFound = false;
  for (const c of seq.contacts) {
    const contactObj = await Contact.findById(c.contactId);
    if (contactObj && contactObj.email === "rishikeshraj072@gmail.com") {
      c.status = "sent";
      c.lastSentDate = fourDaysAgo;
      c.followupCount = 0;
      contactObj.activeSequenceId = seq._id;

      // Make sure contact is not flagged as bounced, unsubscribed or doNotContact
      contactObj.flags = {
        bounced: false,
        doNotContact: false,
        unsubscribe: false
      };
      // Make sure contact's own lastSentDate and outreachStatus match
      contactObj.lastSentDate = fourDaysAgo;
      contactObj.outreachStatus = "SENT";
      contactObj.reply = { replied: false, replyType: null, replyMessage: "", repliedAt: null };
      await contactObj.save();

      contactFound = true;
      console.log(`Updated contact ${contactObj.firstName} ${contactObj.lastName} to be eligible for follow-up.`);
    }
  }

  if (!contactFound) {
    console.error("Brad Halsey contact not found in sequence contacts!");
  } else {
    await seq.save();
    console.log("Sequence updated and saved.");
  }

  await mongoose.disconnect();
}

setup().catch(console.error);
