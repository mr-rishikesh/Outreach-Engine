import mongoose from "mongoose";
import Sequence from "./models/Sequence.js";
import Contact from "./models/Contacts.js";
import { getSequence } from "./controller/sequence.controller.js";
import dotenv from "dotenv";

dotenv.config();

const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/outreach-crm";

async function testReply() {
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");

  const contact = await Contact.findOne({ email: "rishikeshraj072@gmail.com" });
  if (!contact) {
    console.error("Contact not found!");
    await mongoose.disconnect();
    return;
  }

  contact.reply = {
    replied: true,
    replyType: "positive",
    replyMessage: "Yes, I am interested!",
    repliedAt: new Date()
  };
  contact.outreachStatus = "REPLIED_POSITIVE";
  await contact.save();
  console.log("Simulated reply saved on Contact.");

  const seq = await Sequence.findOne({ name: "Rishikesh Kumar Yadav" });
  if (!seq) {
    console.error("Sequence not found!");
    await mongoose.disconnect();
    return;
  }

  const req = { params: { id: seq._id.toString() } };
  const res = {
    status: function() { return this; },
    json: function(data) { console.log("getSequence response fetched."); }
  };
  await getSequence(req, res);

  const updatedContact = await Contact.findById(contact._id);
  const updatedSeq = await Sequence.findById(seq._id);
  const seqContact = updatedSeq.contacts.find(c => c.contactId.toString() === contact._id.toString());

  console.log("=== AFTER REPLY SYNC ===");
  console.log(`Sequence contact status: "${seqContact.status}" (Expected: "replied")`);
  console.log(`Contact activeSequenceId: ${updatedContact.activeSequenceId} (Expected: null)`);

  await mongoose.disconnect();
}

testReply().catch(console.error);
