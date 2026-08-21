import mongoose from "mongoose";
import Sequence from "./models/Sequence.js";
import Contact from "./models/Contacts.js";
import dotenv from "dotenv";

dotenv.config();

const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/outreach-crm";

async function verify() {
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");

  const sequences = await Sequence.find().populate("contacts.contactId").lean();
  console.log("=== SEQUENCES ===");
  sequences.forEach(seq => {
    console.log(`Sequence: ${seq.name} (Status: ${seq.status})`);
    console.log(`Contacts count: ${seq.contacts.length}`);
    seq.contacts.forEach(c => {
      console.log(` - Contact: ${c.contactId?.firstName} ${c.contactId?.lastName} (${c.contactId?.email}) | Status: ${c.status} | Followup Count: ${c.followupCount} | Last Sent: ${c.lastSentDate}`);
    });
  });

  await mongoose.disconnect();
}

verify().catch(console.error);
