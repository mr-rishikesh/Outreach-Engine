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

// Helper to replace placeholders dynamically
const replacePlaceholders = (text, contact) => {
  if (!text) return "";
  return text
    .replace(/{first_name}/g, contact.firstName || "")
    .replace(/{last_name}/g, contact.lastName || "")
    .replace(/{firstName}/g, contact.firstName || "")
    .replace(/{lastName}/g, contact.lastName || "")
    .replace(/{company_name}/g, contact.companyName || contact.companey_name || "")
    .replace(/{companyName}/g, contact.companyName || contact.companey_name || "")
    .replace(/{company}/g, contact.companyName || contact.companey_name || "")
    .replace(/{title}/g, contact.title || contact.role || "")
    .replace(/{role}/g, contact.title || contact.role || "")
    .replace(/{email}/g, contact.email || "");
};

// Helper to format email body, greeting and ensure thank you at the end
const formatEmailContent = (greeting, body, signature, contact) => {
  const defaultGreeting = "Hii {first_name} {last_name}";
  let formattedGreeting = replacePlaceholders(greeting || defaultGreeting, contact);
  let formattedBody = replacePlaceholders(body || "", contact);
  let formattedSignature = replacePlaceholders(signature || "Thank You", contact);

  const hasThankYou = thankq.some(t => formattedSignature.toLowerCase().includes(t.toLowerCase())) || 
                     formattedSignature.toLowerCase().includes("thank") ||
                     formattedBody.toLowerCase().includes("thank");
  
  if (!hasThankYou) {
    const randomThank = thankq[Math.floor(Math.random() * thankq.length)];
    formattedSignature = `${formattedSignature}\n\n${randomThank}`;
  }

  return `${formattedGreeting},\n\n${formattedBody}\n\n${formattedSignature}`;
};

// POST /api/sequences - Create new sequence
export const createSequence = async (req, res) => {
  try {
    const {
      name,
      subject,
      type,
      greeting,
      body,
      signature,
      followupSubject,
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
      subject: subject || "",
      type,
      greeting,
      body,
      signature,
      followupSubject: followupSubject || "",
      followupGreeting,
      followupBody,
      followupSignature,
      followupDays: followupDays || 3,
      maxFollowups: maxFollowups || 1,
      contacts: sequenceContacts
    });

    // Update activeSequenceId on Contact documents
    if (contactIds && contactIds.length > 0) {
      await Contact.updateMany(
        { _id: { $in: contactIds } },
        { $set: { activeSequenceId: sequence._id } }
      );
    }

    res.status(201).json({ success: true, data: sequence });
  } catch (error) {
    console.error("❌ createSequence error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/sequences - Get all sequences with stats
export const getSequences = async (req, res) => {
  try {
    const sequences = await Sequence.find().sort({ createdAt: -1 }).populate("contacts.contactId");
    
    // Map with statistics
    const sequencesWithStats = [];
    
    for (const seq of sequences) {
      let modified = false;
      const stats = {
        total: seq.contacts.length,
        pending: 0,
        sent: 0,
        replied: 0,
        removed: 0
      };

      for (const c of seq.contacts) {
        if (!c.contactId) {
          if (c.status === "removed") {
            stats.removed++;
          } else if (c.status === "replied") {
            stats.replied++;
          } else if (c.status === "pending") {
            stats.pending++;
          } else {
            stats.sent++;
          }
          continue;
        }

        const contact = c.contactId;

        // Auto sync reply status
        if (c.status !== "replied" && c.status !== "removed") {
          if (
            contact.reply?.replied || 
            contact.outreachStatus === "REPLIED_POSITIVE" || 
            contact.outreachStatus === "REPLIED_NEGATIVE"
          ) {
            c.status = "replied";
            modified = true;
            await Contact.findByIdAndUpdate(contact._id, { $set: { activeSequenceId: null } });
          }
        }

        if (c.status === "removed") {
          stats.removed++;
        } else if (c.status === "replied") {
          stats.replied++;
        } else if (c.status === "pending") {
          stats.pending++;
        } else {
          stats.sent++;
        }
      }

      if (modified) {
        await seq.save();
      }

      // Convert to plain object for response
      const seqObj = seq.toObject();
      sequencesWithStats.push({
        ...seqObj,
        stats
      });
    }

    res.json({ success: true, data: sequencesWithStats });
  } catch (error) {
    console.error("❌ getSequences error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/sequences/:id - Get detailed single sequence
export const getSequence = async (req, res) => {
  try {
    const sequence = await Sequence.findById(req.params.id)
      .populate("contacts.contactId");

    if (!sequence) {
      return res.status(404).json({ success: false, error: "Sequence not found." });
    }

    let modified = false;
    for (const c of sequence.contacts) {
      if (c.contactId && c.status !== "replied" && c.status !== "removed") {
        const contact = c.contactId;
        if (
          contact.reply?.replied || 
          contact.outreachStatus === "REPLIED_POSITIVE" || 
          contact.outreachStatus === "REPLIED_NEGATIVE"
        ) {
          c.status = "replied";
          modified = true;
          await Contact.findByIdAndUpdate(contact._id, { $set: { activeSequenceId: null } });
        }
      }
    }

    if (modified) {
      await sequence.save();
    }

    res.json({ success: true, data: sequence.toObject() });
  } catch (error) {
    console.error("❌ getSequence error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH /api/sequences/:id - Update sequence templates/settings
export const updateSequence = async (req, res) => {
  try {
    const { name, subject, status, greeting, body, signature, followupSubject, followupGreeting, followupBody, followupSignature, followupDays, maxFollowups } = req.body;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (subject !== undefined) updateData.subject = subject;
    if (status !== undefined) updateData.status = status;
    if (greeting !== undefined) updateData.greeting = greeting;
    if (body !== undefined) updateData.body = body;
    if (signature !== undefined) updateData.signature = signature;
    if (followupSubject !== undefined) updateData.followupSubject = followupSubject;
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

    // Clear activeSequenceId for all contacts in this deleted sequence
    await Contact.updateMany(
      { activeSequenceId: req.params.id },
      { $set: { activeSequenceId: null } }
    );

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

        // Update activeSequenceId on Contact documents
        const addedIds = newContacts.map(c => c.contactId);
        await Contact.updateMany(
          { _id: { $in: addedIds } },
          { $set: { activeSequenceId: sequence._id } }
        );
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

      // Clear activeSequenceId for removed contacts
      const removedIds = ids.filter(id => id);
      await Contact.updateMany(
        { _id: { $in: removedIds }, activeSequenceId: sequence._id },
        { $set: { activeSequenceId: null } }
      );
    } else if (action === "update_status") {
      sequence.contacts.forEach(c => {
        if (c.contactId.toString() === contactId.toString()) {
          c.status = status;
        }
      });
      await sequence.save();

      // If status is removed or replied, clear activeSequenceId
      if (status === "removed" || status === "replied") {
        await Contact.findOneAndUpdate(
          { _id: contactId, activeSequenceId: sequence._id },
          { $set: { activeSequenceId: null } }
        );
      } else if (status === "pending" || status === "sent" || status === "followup_pending") {
        // Restore activeSequenceId
        await Contact.findOneAndUpdate(
          { _id: contactId },
          { $set: { activeSequenceId: sequence._id } }
        );
      }
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
    const { type } = req.body; // 'primary' or 'followup'
    const sequence = await Sequence.findById(req.params.id).populate("contacts.contactId");
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

    const results = { sent: [], failed: [], skipped: [] };
    const now = new Date();
    const delayDaysAgo = new Date();
    delayDaysAgo.setDate(delayDaysAgo.getDate() - sequence.followupDays);

    const eligible = [];
    let sequenceModified = false;
    
    sequence.contacts.forEach((sc, index) => {
      if (sc.status === "removed" || !sc.contactId) return;

      const contact = sc.contactId;

      // Sync/Check if they replied
      if (
        contact.reply?.replied || 
        contact.outreachStatus === "REPLIED_POSITIVE" || 
        contact.outreachStatus === "REPLIED_NEGATIVE" || 
        sc.status === "replied"
      ) {
        if (sequence.contacts[index].status !== "replied") {
          sequence.contacts[index].status = "replied";
          sequenceModified = true;
          // Clear activeSequenceId
          Contact.findByIdAndUpdate(contact._id, { $set: { activeSequenceId: null } }).catch(err => {
            console.error(`Error clearing activeSequenceId for contact ${contact._id}:`, err);
          });
        }
        return; // Skip replied
      }

      // Skip blocked/doNotContact
      if (contact.flags?.doNotContact || contact.flags?.bounced || contact.flags?.unsubscribe) {
        if (sequence.contacts[index].status !== "removed") {
          sequence.contacts[index].status = "removed";
          sequenceModified = true;
          // Clear activeSequenceId
          Contact.findByIdAndUpdate(contact._id, { $set: { activeSequenceId: null } }).catch(err => {
            console.error(`Error clearing activeSequenceId for contact ${contact._id}:`, err);
          });
        }
        return;
      }

      // Check first touch
      if (type === "primary") {
        if (sc.status === "pending") {
          eligible.push({ index, sc, contact, isFollowup: false });
        }
      } 
      // Check follow-up touch
      else if (type === "followup") {
        if (
          (sc.status === "sent" || sc.status === "followup_pending") &&
          sc.followupCount < sequence.maxFollowups &&
          sequence.followupBody
        ) {
          eligible.push({ index, sc, contact, isFollowup: true });
        }
      } else {
        // Fallback: both touch types with original delay checks
        if (sc.status === "pending") {
          eligible.push({ index, sc, contact, isFollowup: false });
        } else if (
          (sc.status === "sent" || sc.status === "followup_pending") &&
          sc.lastSentDate && 
          new Date(sc.lastSentDate) <= delayDaysAgo && 
          sc.followupCount < sequence.maxFollowups &&
          sequence.followupBody
        ) {
          eligible.push({ index, sc, contact, isFollowup: true });
        }
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
          ? replacePlaceholders(sequence.followupSubject || `Re: ${sequence.subject || sequence.name} follow-up`, contact)
          : replacePlaceholders(sequence.subject || sequence.name, contact);

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
          sequenceModified = true;

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
          // Failed to send: Do NOT mark as bounced or removed. Just update lastSentDate to allow retry after followupDays
          sequence.contacts[index].lastSentDate = now;
          sequence.contacts[index].status = isFollowup ? "followup_pending" : "sent";
          if (isFollowup) {
            sequence.contacts[index].followupCount += 1;
            if (sequence.contacts[index].followupCount >= sequence.maxFollowups) {
              sequence.contacts[index].status = "sent"; // Finished followups
            }
          }
          sequenceModified = true;

          await Contact.findByIdAndUpdate(contact._id, {
            $set: {
              lastSentDate: now,
              outreachStatus: isFollowup ? "FOLLOWUP_PENDING" : "SENT",
            },
          });
          results.failed.push({ id: contact._id, email: contact.email, reason: "Nodemailer send failed (updated lastSentDate)" });
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
        // Do NOT mark as bounced or removed. Just update lastSentDate to allow retry after followupDays
        sequence.contacts[index].lastSentDate = now;
        sequence.contacts[index].status = isFollowup ? "followup_pending" : "sent";
        if (isFollowup) {
          sequence.contacts[index].followupCount += 1;
          if (sequence.contacts[index].followupCount >= sequence.maxFollowups) {
            sequence.contacts[index].status = "sent"; // Finished followups
          }
        }
        sequenceModified = true;

        await Contact.findByIdAndUpdate(contact._id, {
          $set: {
            lastSentDate: now,
            outreachStatus: isFollowup ? "FOLLOWUP_PENDING" : "SENT",
          },
        });
        results.failed.push({ id: contact._id, email: contact.email, error: err.message });
        processed++;
      }
    }

    // Save changes to the sequence
    if (processed > 0 || sequenceModified) {
      await sequence.save();
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error("❌ runSequence error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/sequences/:id/eligible
export const getEligibleContacts = async (req, res) => {
  try {
    const { type } = req.query; // 'primary' or 'followup'
    const sequence = await Sequence.findById(req.params.id).populate("contacts.contactId");
    if (!sequence) {
      return res.status(404).json({ success: false, error: "Sequence not found." });
    }

    if (sequence.status !== "active") {
      return res.status(400).json({ success: false, error: `Sequence is not active.` });
    }

    const eligible = [];
    sequence.contacts.forEach((sc) => {
      if (sc.status === "removed" || !sc.contactId) return;

      const contact = sc.contactId;

      // Skip replied
      if (
        contact.reply?.replied || 
        contact.outreachStatus === "REPLIED_POSITIVE" || 
        contact.outreachStatus === "REPLIED_NEGATIVE" || 
        sc.status === "replied"
      ) {
        return;
      }

      // Skip bounced / doNotContact / unsubscribe
      if (contact.flags?.doNotContact || contact.flags?.bounced || contact.flags?.unsubscribe) {
        return;
      }

      // Check primary eligibility
      if (type === "primary") {
        if (sc.status === "pending") {
          eligible.push(contact);
        }
      } 
      // Check follow-up eligibility (bypassing time constraint per user's request)
      else if (type === "followup") {
        if (
          (sc.status === "sent" || sc.status === "followup_pending") &&
          sc.followupCount < sequence.maxFollowups &&
          sequence.followupBody
        ) {
          eligible.push(contact);
        }
      }
    });

    res.json({ success: true, data: eligible });
  } catch (error) {
    console.error("❌ getEligibleContacts error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/sequences/:id/send-single
export const sendSingleSequenceEmail = async (req, res) => {
  try {
    const { contactId, type } = req.body; // 'primary' or 'followup'
    const sequence = await Sequence.findById(req.params.id).populate("contacts.contactId");
    if (!sequence) {
      return res.status(404).json({ success: false, error: "Sequence not found." });
    }

    if (sequence.status !== "active") {
      return res.status(400).json({ success: false, error: `Sequence is not active.` });
    }

    const settings = await getOrInitializeSettings();
    if (settings.emailsSentToday >= settings.maxEmailsPerDay) {
      return res.status(400).json({ 
        success: false, 
        error: `Daily limit of ${settings.maxEmailsPerDay} emails reached.` 
      });
    }

    const index = sequence.contacts.findIndex(c => c.contactId && c.contactId._id.toString() === contactId.toString());
    if (index === -1) {
      return res.status(404).json({ success: false, error: "Contact not found in sequence." });
    }

    const sc = sequence.contacts[index];
    const contact = sc.contactId;

    if (isBlockedDomain(contact.email)) {
      return res.status(400).json({ success: false, error: "Email domain is blocked." });
    }

    const now = new Date();
    const isFollowup = type === "followup";

    const emailSubject = isFollowup
      ? replacePlaceholders(sequence.followupSubject || `Re: ${sequence.subject || sequence.name} follow-up`, contact)
      : replacePlaceholders(sequence.subject || sequence.name, contact);

    const emailText = isFollowup
      ? formatEmailContent(sequence.followupGreeting, sequence.followupBody, sequence.followupSignature, contact)
      : formatEmailContent(sequence.greeting, sequence.body, sequence.signature, contact);

    const { seccess } = await sendEmailsNodemailer({ subject: emailSubject, bdy: emailText }, contact.email);

    if (seccess) {
      // Update Sequence contact status
      sequence.contacts[index].lastSentDate = now;
      sequence.contacts[index].status = isFollowup ? "followup_pending" : "sent";
      if (isFollowup) {
        sequence.contacts[index].followupCount += 1;
        if (sequence.contacts[index].followupCount >= sequence.maxFollowups) {
          sequence.contacts[index].status = "sent"; // Finished followups
        }
      }

      // Also set top-level lastSentDate on the Sequence itself (for user's new requirement!)
      sequence.lastSentDate = now;

      await sequence.save();

      // Update Contact record
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

      // Increment settings
      settings.emailsSentToday += 1;
      await settings.save();

      res.json({ success: true });
    } else {
      // Failed to send
      sequence.contacts[index].lastSentDate = now;
      sequence.contacts[index].status = isFollowup ? "followup_pending" : "sent";
      if (isFollowup) {
        sequence.contacts[index].followupCount += 1;
        if (sequence.contacts[index].followupCount >= sequence.maxFollowups) {
          sequence.contacts[index].status = "sent";
        }
      }
      sequence.lastSentDate = now;
      await sequence.save();

      await Contact.findByIdAndUpdate(contact._id, {
        $set: {
          lastSentDate: now,
          outreachStatus: isFollowup ? "FOLLOWUP_PENDING" : "SENT",
        },
      });

      res.status(500).json({ success: false, error: "Nodemailer send failed." });
    }
  } catch (error) {
    console.error("❌ sendSingleSequenceEmail error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
