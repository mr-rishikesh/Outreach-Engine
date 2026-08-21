import mongoose from "mongoose";
import Sequence from "../models/Sequence.js";
import Contact from "../models/Contacts.js";
import { sendEmailsNodemailer } from "../email-service/index.js";
import { isBlockedDomain } from "../utils/blockedDomains.js";
import { getOrInitializeSettings } from "../controller/settings.controller.js";

const thankq = [
  "Thanks", "Thank You", "Thanks..", "Thank You..",
  "Thank You so much for Considering", "Thank a lot",
  "Thanks for considering", "Thank You...", "Thanks....", "Thanks ..",
  "Thank you so much ... ",
];

// Helper to format email body, greeting and ensure thank you at the end
const formatEmailContent = (greeting, body, signature, contact) => {
  let formattedGreeting = greeting || "Hii {first_name} {last_name}";
  formattedGreeting = formattedGreeting
    .replace(/{first_name}/g, contact.firstName || "")
    .replace(/{last_name}/g, contact.lastName || "")
    .replace(/{firstName}/g, contact.firstName || "")
    .replace(/{lastName}/g, contact.lastName || "");

  let formattedSignature = signature || "Thank You";
  const hasThankYou = thankq.some(t => formattedSignature.toLowerCase().includes(t.toLowerCase())) || 
                     formattedSignature.toLowerCase().includes("thank");
  
  if (!hasThankYou) {
    const randomThank = thankq[Math.floor(Math.random() * thankq.length)];
    formattedSignature = `${randomThank}\n\n${formattedSignature}`;
  }

  return `${formattedGreeting},\n\n${body}\n\n${formattedSignature}`;
};

// POST /api/sequences - Create new sequence
export const createSequence = async (req, res) => {
  try {
    const {
      name,
      type,
      greeting,
      body,
      signature,
      followupGreeting,
      followupBody,
      followupSignature,
      followupDays,
      maxFollowups,
      contactIds
    } = req.body;

    if (!name || !type || !body) {
      return res.status(400).json({ success: false, error: "Name, type, and body are required." });
    }

    const sequenceContacts = (contactIds || []).map(id => ({
      contactId: id,
      status: "pending",
      lastSentDate: null,
      followupCount: 0
    }));

    const sequence = await Sequence.create({
      name,
      type,
      greeting,
      body,
      signature,
      followupGreeting,
      followupBody,
      followupSignature,
      followupDays: followupDays || 3,
      maxFollowups: maxFollowups || 1,
      contacts: sequenceContacts
    });

    res.status(201).json({ success: true, data: sequence });
  } catch (error) {
    console.error("❌ createSequence error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/sequences - Get all sequences with stats
export const getSequences = async (req, res) => {
  try {
    const sequences = await Sequence.find().lean();
    
    // Map with statistics from Batches
    const sequencesWithStats = await Promise.all(sequences.map(async (seq) => {
      const batches = await mongoose.model("Batch").find({ sequence_id: seq._id }).populate("contacts");
      
      const stats = {
        total: 0,
        pending: 0,
        sent: 0,
        replied: 0,
        removed: 0
      };

      batches.forEach(b => {
        if (!b.contacts) return;
        stats.total += b.contacts.length;
        b.contacts.forEach(c => {
          if (c.reply?.replied) {
            stats.replied++;
          } else if (c.flags?.doNotContact || c.flags?.bounced || c.flags?.unsubscribe) {
            stats.removed++;
          } else if (c.next_send_type === "email" || (!c.next_send_type && c.emailStats?.emailsSent === 0)) {
            stats.pending++;
          } else {
            stats.sent++;
          }
        });
      });

      return {
        ...seq,
        stats
      };
    }));

    res.json({ success: true, data: sequencesWithStats });
  } catch (error) {
    console.error("❌ getSequences error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/sequences/:id - Get detailed single sequence
export const getSequence = async (req, res) => {
  try {
    const sequence = await Sequence.findById(req.params.id).lean();

    if (!sequence) {
      return res.status(404).json({ success: false, error: "Sequence not found." });
    }

    res.json({ success: true, data: sequence });
  } catch (error) {
    console.error("❌ getSequence error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH /api/sequences/:id - Update sequence templates/settings
export const updateSequence = async (req, res) => {
  try {
    const { name, subject, status, greeting, body, signature, followupGreeting, followupBody, followupSignature, followupDays, maxFollowups } = req.body;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (subject !== undefined) updateData.subject = subject;
    if (status !== undefined) updateData.status = status;
    if (greeting !== undefined) updateData.greeting = greeting;
    if (body !== undefined) updateData.body = body;
    if (signature !== undefined) updateData.signature = signature;
    if (followupGreeting !== undefined) updateData.followupGreeting = followupGreeting;
    if (followupBody !== undefined) updateData.followupBody = followupBody;
    if (followupSignature !== undefined) updateData.followupSignature = followupSignature;
    if (followupDays !== undefined) updateData.followupDays = followupDays;
    if (maxFollowups !== undefined) updateData.maxFollowups = maxFollowups;

    const sequence = await Sequence.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!sequence) {
      return res.status(404).json({ success: false, error: "Sequence not found." });
    }

    res.json({ success: true, data: sequence });
  } catch (error) {
    console.error("❌ updateSequence error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE /api/sequences/:id - Delete a sequence
export const deleteSequence = async (req, res) => {
  try {
    const sequence = await Sequence.findByIdAndDelete(req.params.id);
    if (!sequence) {
      return res.status(404).json({ success: false, error: "Sequence not found." });
    }
    res.json({ success: true, message: "Sequence deleted successfully." });
  } catch (error) {
    console.error("❌ deleteSequence error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/sequences/:id/contacts - Manage contacts (add/remove/edit)
export const manageContacts = async (req, res) => {
  try {
    const { action, contactIds, contactId, status } = req.body;
    const sequence = await Sequence.findById(req.params.id);
    
    if (!sequence) {
      return res.status(404).json({ success: false, error: "Sequence not found." });
    }

    if (action === "add") {
      const ids = Array.isArray(contactIds) ? contactIds : [contactId];
      // Filter out ids already in sequence
      const existingIds = sequence.contacts.map(c => c.contactId.toString());
      const newContacts = ids
        .filter(id => id && !existingIds.includes(id.toString()))
        .map(id => ({
          contactId: id,
          status: "pending",
          lastSentDate: null,
          followupCount: 0
        }));

      if (newContacts.length > 0) {
        sequence.contacts.push(...newContacts);
        await sequence.save();
      }
    } else if (action === "remove") {
      const ids = Array.isArray(contactIds) ? contactIds : [contactId];
      // Instead of pulling, mark status as removed (preserving history)
      sequence.contacts.forEach(c => {
        if (ids.map(id => id.toString()).includes(c.contactId.toString())) {
          c.status = "removed";
        }
      });
      await sequence.save();
    } else if (action === "update_status") {
      sequence.contacts.forEach(c => {
        if (c.contactId.toString() === contactId.toString()) {
          c.status = status;
        }
      });
      await sequence.save();
    } else {
      return res.status(400).json({ success: false, error: "Invalid action type." });
    }

    res.json({ success: true, data: sequence });
  } catch (error) {
    console.error("❌ manageContacts error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/sequences/:id/run - Execute pending/follow-up email sends in sequence
export const runSequence = async (req, res) => {
  try {
    const sequence = await Sequence.findById(req.params.id);
    if (!sequence) {
      return res.status(404).json({ success: false, error: "Sequence not found." });
    }

    if (sequence.status !== "active") {
      return res.status(400).json({ success: false, error: `Sequence is not active (currently ${sequence.status}).` });
    }

    const settings = await getOrInitializeSettings();
    if (settings.emailsSentToday >= settings.maxEmailsPerDay) {
      return res.status(400).json({ 
        success: false, 
        error: `Daily limit of ${settings.maxEmailsPerDay} emails reached. Current count: ${settings.emailsSentToday}.` 
      });
    }

    // Populate contacts
    const populatedSeq = await Sequence.findById(req.params.id).populate("contacts.contactId");
    
    const results = { sent: [], failed: [], skipped: [] };
    const now = new Date();
    const delayDaysAgo = new Date();
    delayDaysAgo.setDate(delayDaysAgo.getDate() - sequence.followupDays);

    const eligible = [];
    
    populatedSeq.contacts.forEach((sc, index) => {
      if (sc.status === "removed" || !sc.contactId) return;

      const contact = sc.contactId;

      // Skip blocked/doNotContact
      if (contact.flags?.doNotContact || contact.flags?.bounced || contact.flags?.unsubscribe) {
        return;
      }

      // Check first touch
      if (sc.status === "pending") {
        eligible.push({ index, sc, contact, isFollowup: false });
      } 
      // Check follow-up touch
      else if (
        sc.status === "sent" &&
        sc.lastSentDate && 
        new Date(sc.lastSentDate) <= delayDaysAgo && 
        sc.followupCount < sequence.maxFollowups &&
        sequence.followupBody
      ) {
        eligible.push({ index, sc, contact, isFollowup: true });
      }
    });

    console.log(`🚀 Executing sequence "${sequence.name}"`);
    console.log(`📊 Found ${eligible.length} eligible contacts to process`);

    let processed = 0;
    const totalEligible = eligible.length;

    for (const item of eligible) {
      const { index, sc, contact, isFollowup } = item;

      if (settings.emailsSentToday >= settings.maxEmailsPerDay) {
        results.skipped.push({ id: contact._id, email: contact.email, reason: `Daily limit of ${settings.maxEmailsPerDay} emails reached.` });
        processed++;
        continue;
      }

      if (isBlockedDomain(contact.email)) {
        results.skipped.push({ id: contact._id, email: contact.email, reason: "Blocked domain" });
        processed++;
        continue;
      }

      try {
        const emailSubject = isFollowup
          ? `Re: ${sequence.name} follow-up`
          : `${sequence.name}`;

        const emailText = isFollowup
          ? formatEmailContent(sequence.followupGreeting, sequence.followupBody, sequence.followupSignature, contact)
          : formatEmailContent(sequence.greeting, sequence.body, sequence.signature, contact);

        const { seccess } = await sendEmailsNodemailer({ subject: emailSubject, bdy: emailText }, contact.email);

        if (seccess) {
          // Update Sequence model contact entry
          sequence.contacts[index].lastSentDate = now;
          sequence.contacts[index].status = isFollowup ? "followup_pending" : "sent";
          if (isFollowup) {
            sequence.contacts[index].followupCount += 1;
            if (sequence.contacts[index].followupCount >= sequence.maxFollowups) {
              sequence.contacts[index].status = "sent"; // Finished followups
            }
          }

          // Update main Contact record
          await Contact.findByIdAndUpdate(contact._id, {
            $set: {
              lastSentDate: now,
              outreachStatus: isFollowup ? "FOLLOWUP_PENDING" : "SENT",
            },
            $inc: { "emailStats.emailsSent": 1 },
            $push: { 
              emails: { 
                type: isFollowup ? "followup" : "outreach", 
                subject: emailSubject, 
                sentAt: now 
              } 
            },
          });

          // Increment settings emailsSentToday
          settings.emailsSentToday += 1;
          await settings.save();

          results.sent.push({ id: contact._id, email: contact.email, isFollowup });
        } else {
          // Failed to send, mark as bounced
          sequence.contacts[index].status = "removed"; // remove from run sequence
          await Contact.findByIdAndUpdate(contact._id, {
            $set: {
              "flags.bounced": true,
              outreachStatus: "NO_RESPONSE",
            },
          });
          results.failed.push({ id: contact._id, email: contact.email, reason: "Nodemailer send failed" });
        }

        processed++;
        // Apply rate limit delay between emails based on Settings
        if (processed < totalEligible && settings.emailsSentToday < settings.maxEmailsPerDay) {
          const delaySec = Math.floor(Math.random() * (settings.maxDelaySeconds - settings.minDelaySeconds + 1)) + settings.minDelaySeconds;
          console.log(`⏳ Waiting ${delaySec} seconds before next email...`);
          await new Promise((resolve) => setTimeout(resolve, delaySec * 1000));
        }
      } catch (err) {
        console.error(`Error sending email to ${contact.email}:`, err);
        sequence.contacts[index].status = "removed";
        await Contact.findByIdAndUpdate(contact._id, {
          $set: {
            "flags.bounced": true,
            outreachStatus: "NO_RESPONSE",
          },
        });
        results.failed.push({ id: contact._id, email: contact.email, error: err.message });
        processed++;
      }
    }

    // Save changes to the sequence
    if (processed > 0) {
      await sequence.save();
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error("❌ runSequence error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
