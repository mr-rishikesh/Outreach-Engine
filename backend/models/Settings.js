import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  maxEmailsPerDay: {
    type: Number,
    default: 300
  },
  minDelaySeconds: {
    type: Number,
    default: 60
  },
  maxDelaySeconds: {
    type: Number,
    default: 90
  },
  emailsSentToday: {
    type: Number,
    default: 0
  },
  lastResetDate: {
    type: Date,
    default: () => new Date()
  }
}, { timestamps: true });

export default mongoose.model("Settings", settingsSchema);
