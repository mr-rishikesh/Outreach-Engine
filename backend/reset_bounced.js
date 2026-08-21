import mongoose from "mongoose";
import Sequence from "./models/Sequence.js";
import Contact from "./models/Contacts.js";
import dotenv from "dotenv";

dotenv.config();

const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/outreach-crm";

async function reset() {
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");

  const seq = await Sequence.findOne({ name: "Rishikesh Kumar Yadav" });
  if (!seq) {
    console.error("Sequence not found.");
    await mongoose.disconnect();
    return;
  }

  for (const c of seq.contacts) {
    c.status = "pending";
    c.lastSentDate = null;
    c.followupCount = 0;

    await Contact.findByIdAndUpdate(c.contactId, {
      $set: {
        "flags.bounced": false,
        "flags.doNotContact": false,
        "flags.unsubscribe": false,
        outreachStatus: "NOT_SENT"
      }
    });
  }

  await seq.save();
  console.log("Successfully reset all contacts in sequence 'Rishikesh Kumar Yadav' to pending status and cleared bounced flags.");

  await mongoose.disconnect();
}

reset().catch(console.error);
