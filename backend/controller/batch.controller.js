import Batch from "../models/Batch.js";
import Contact from "../models/Contacts.js";
import { runDailyScheduler } from "../services/sequenceScheduler.js";

export const createBatch = async (req, res) => {
  try {
    const { name, sequence_id, contactIds, email_send_date, follow_up_dates } = req.body;
    if (!sequence_id || !email_send_date) {
      return res.status(400).json({ success: false, error: "sequence_id and email_send_date are required." });
    }

    const batch = await Batch.create({
      name: name || "",
      sequence_id,
      contacts: contactIds || [],
      email_send_date,
      follow_up_dates: follow_up_dates || [],
      status: "active"
    });

    // Update contacts
    if (contactIds && contactIds.length > 0) {
      await Contact.updateMany(
        { _id: { $in: contactIds } },
        {
          $set: {
            batch_id: batch._id,
            sequence_id: sequence_id,
            next_send_date: email_send_date,
            next_send_type: "email"
          }
        }
      );
    }

    res.status(201).json({ success: true, data: batch });
  } catch (error) {
    console.error("❌ createBatch error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getSequenceBatches = async (req, res) => {
  try {
    const { sequenceId } = req.params;
    const batches = await Batch.find({ sequence_id: sequenceId })
      .populate("contacts")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: batches });
  } catch (error) {
    console.error("❌ getSequenceBatches error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contacts, email_send_date, follow_up_dates, status } = req.body;

    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({ success: false, error: "Batch not found." });
    }

    const oldContacts = batch.contacts.map(c => c.toString());
    const newContacts = contacts ? contacts.map(c => c.toString()) : oldContacts;

    if (name !== undefined) batch.name = name;
    if (status !== undefined) batch.status = status;
    if (email_send_date !== undefined) batch.email_send_date = email_send_date;
    if (follow_up_dates !== undefined) batch.follow_up_dates = follow_up_dates;
    if (contacts !== undefined) batch.contacts = contacts;

    await batch.save();

    // Synchronize contact fields
    // 1. Contacts removed from batch:
    const removedContacts = oldContacts.filter(c => !newContacts.includes(c));
    if (removedContacts.length > 0) {
      await Contact.updateMany(
        { _id: { $in: removedContacts } },
        {
          $set: {
            batch_id: null,
            sequence_id: null,
            next_send_date: null,
            next_send_type: null
          }
        }
      );
    }

    // 2. Contacts added or existing in batch:
    const currentBatchContacts = await Contact.find({ _id: { $in: newContacts } });

    for (const contact of currentBatchContacts) {
      let updateFields = {};
      // If newly added:
      if (!contact.batch_id || contact.batch_id.toString() !== id) {
        updateFields = {
          batch_id: batch._id,
          sequence_id: batch.sequence_id,
          next_send_date: batch.email_send_date,
          next_send_type: "email"
        };
      } else {
        // Existing contact in batch - update date based on type
        if (contact.next_send_type === "email") {
          updateFields.next_send_date = batch.email_send_date;
        } else if (contact.next_send_type === "followup") {
          const index = (contact.emailStats?.emailsSent || 1) - 1;
          if (batch.follow_up_dates && batch.follow_up_dates.length > index) {
            updateFields.next_send_date = batch.follow_up_dates[index];
          } else {
            // No more follow-up dates available
            updateFields.next_send_date = null;
            updateFields.next_send_type = null;
            updateFields.batch_id = null;
          }
        }
      }

      if (Object.keys(updateFields).length > 0) {
        await Contact.findByIdAndUpdate(contact._id, { $set: updateFields });
      }
    }

    res.json({ success: true, data: batch });
  } catch (error) {
    console.error("❌ updateBatch error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const batch = await Batch.findByIdAndDelete(id);
    if (!batch) {
      return res.status(404).json({ success: false, error: "Batch not found." });
    }

    // Set associated contacts' batch and sequence ids to null
    await Contact.updateMany(
      { batch_id: id },
      {
        $set: {
          batch_id: null,
          sequence_id: null,
          next_send_date: null,
          next_send_type: null
        }
      }
    );

    res.json({ success: true, message: "Batch deleted successfully." });
  } catch (error) {
    console.error("❌ deleteBatch error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const runSchedulerManual = async (req, res) => {
  try {
    await runDailyScheduler();
    res.json({ success: true, message: "Daily scheduler executed manually." });
  } catch (error) {
    console.error("❌ runSchedulerManual error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
