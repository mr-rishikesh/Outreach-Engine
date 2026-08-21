import mongoose from "mongoose";

const batchSchema = new mongoose.Schema({
  name: {
    type: String,
    default: ""
  },
  sequence_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Sequence",
    required: true
  },
  contacts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Contact"
  }],
  email_send_date: {
    type: Date,
    required: true
  },
  follow_up_dates: [{
    type: Date
  }],
  status: {
    type: String,
    enum: ["active", "paused"],
    default: "active"
  }
}, { timestamps: true });

const Batch = mongoose.model("Batch", batchSchema);
export default Batch;
