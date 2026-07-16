import mongoose from "mongoose";

const sequenceContactSchema = new mongoose.Schema({
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Contact",
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "sent", "followup_pending", "replied", "removed"],
    default: "pending"
  },
  lastSentDate: {
    type: Date,
    default: null
  },
  followupCount: {
    type: Number,
    default: 0
  }
});

const sequenceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ["direct_apply", "referral"],
    required: true
  },
  status: {
    type: String,
    enum: ["active", "paused", "stopped"],
    default: "active"
  },
  greeting: {
    type: String,
    default: "Hii {first_name} {last_name}"
  },
  body: {
    type: String,
    required: true
  },
  signature: {
    type: String,
    default: "Thank You"
  },
  followupGreeting: {
    type: String,
    default: "Hii {first_name} {last_name}"
  },
  followupBody: {
    type: String,
    default: ""
  },
  followupSignature: {
    type: String,
    default: "Thank You"
  },
  followupDays: {
    type: Number,
    default: 3
  },
  maxFollowups: {
    type: Number,
    default: 1
  },
  contacts: [sequenceContactSchema]
}, { timestamps: true });

export default mongoose.model("Sequence", sequenceSchema);
