import mongoose from "mongoose";
import Sequence from "./models/Sequence.js";
import { runSequence } from "./controller/sequence.controller.js";
import dotenv from "dotenv";

dotenv.config();

const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/outreach-crm";

async function testRun() {
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");

  const seq = await Sequence.findOne({ name: "Rishikesh Kumar Yadav" });
  if (!seq) {
    console.error("Sequence not found!");
    await mongoose.disconnect();
    return;
  }

  console.log(`Running sequence: ${seq.name} (${seq._id})`);

  const req = {
    params: { id: seq._id.toString() }
  };
  const res = {
    status: function(code) {
      console.log(`Status set: ${code}`);
      return this;
    },
    json: function(data) {
      console.log("Response JSON:");
      console.log(JSON.stringify(data, null, 2));
    }
  };

  await runSequence(req, res);

  await mongoose.disconnect();
}

testRun().catch(console.error);
