import Contact from "../models/Contacts.js";
import Sequence from "../models/Sequence.js";

// Helper to map and sync dual fields for compatibility
const mapIncomingContactFields = (data) => {
  const mapped = { ...data };
  if (mapped.companey_name !== undefined) mapped.companyName = mapped.companey_name;
  if (mapped.companyName !== undefined) mapped.companey_name = mapped.companyName;

  if (mapped.role !== undefined) mapped.title = mapped.role;
  if (mapped.title !== undefined) mapped.role = mapped.title;

  if (mapped.companey_url !== undefined) mapped.website = mapped.companey_url;
  if (mapped.website !== undefined) mapped.companey_url = mapped.website;

  if (mapped.linkedin !== undefined) mapped.personLinkedinUrl = mapped.linkedin;
  if (mapped.personLinkedinUrl !== undefined) mapped.linkedin = mapped.personLinkedinUrl;

  if (mapped.twitter !== undefined) mapped.twitterUrl = mapped.twitter;
  if (mapped.twitterUrl !== undefined) mapped.twitter = mapped.twitterUrl;

  if (mapped.phone !== undefined) mapped.workDirectPhone = mapped.phone;
  if (mapped.workDirectPhone !== undefined) mapped.phone = mapped.workDirectPhone;

  return mapped;
};

// POST /api/contacts - manual lead creation
export const createContact = async (req, res) => {
  try {
    const mappedBody = mapIncomingContactFields(req.body);
    const { email } = mappedBody;

    if (email) {
      const existing = await Contact.findOne({ email });
      if (existing) {
        return res.status(400).json({ success: false, error: "A contact with this email already exists." });
      }
    }

    const contact = await Contact.create(mappedBody);
    res.status(201).json({ success: true, data: contact });
  } catch (error) {
    console.error("❌ createContact error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/contacts - paginated, sorted, searchable
export const getContacts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      sort = "-createdAt",
      search = "",
      fields,
    } = req.query;

    const query = {};

    // Search by name, email, or company
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { companyName: { $regex: search, $options: "i" } },
        { companey_name: { $regex: search, $options: "i" } },
        { role: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { source: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Field projection
    let projection = null;
    if (fields) {
      projection = fields.split(",").reduce((acc, f) => {
        acc[f.trim()] = 1;
        return acc;
      }, {});
    }

    const [contacts, total] = await Promise.all([
      Contact.find(query, projection)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Contact.countDocuments(query),
    ]);

    console.log(`📊 getContacts - Total: ${total}, Returned: ${contacts.length}, Page: ${page}`);

    res.json({
      success: true,
      data: contacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("❌ getContacts error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/contacts/filter - advanced filtering
export const filterContacts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      sort = "-createdAt",
      // filters
      outreachStatus,
      replied,
      replyType,
      followupCountMin,
      followupCountMax,
      nextFollowupBefore,
      nextFollowupAfter,
      opened,
      emailsSentMin,
      emailsSentMax,
      doNotContact,
      bounced,
      unsubscribe,
      company,
      role,
      dateFrom,
      dateTo,
      search,
      // Enhanced filters
      engagement,
      source,
      last_reach_source,
      lastReachDateFrom,
      lastReachDateTo,
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { companyName: { $regex: search, $options: "i" } },
        { companey_name: { $regex: search, $options: "i" } },
        { role: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { source: { $regex: search, $options: "i" } },
      ];
    }

    if (outreachStatus) {
      query.outreachStatus = { $in: outreachStatus.split(",") };
    }

    if (replied !== undefined) {
      query["reply.replied"] = replied === "true";
    }

    if (replyType) {
      query["reply.replyType"] = { $in: replyType.split(",") };
    }

    if (followupCountMin || followupCountMax) {
      query["followup.followupCount"] = {};
      if (followupCountMin) query["followup.followupCount"].$gte = parseInt(followupCountMin);
      if (followupCountMax) query["followup.followupCount"].$lte = parseInt(followupCountMax);
    }

    if (nextFollowupBefore || nextFollowupAfter) {
      query["followup.nextFollowupAt"] = {};
      if (nextFollowupAfter) query["followup.nextFollowupAt"].$gte = new Date(nextFollowupAfter);
      if (nextFollowupBefore) query["followup.nextFollowupAt"].$lte = new Date(nextFollowupBefore);
    }

    if (opened !== undefined) {
      query["emailStats.opened"] = opened === "true";
    }

    if (emailsSentMin || emailsSentMax) {
      query["emailStats.emailsSent"] = {};
      if (emailsSentMin) query["emailStats.emailsSent"].$gte = parseInt(emailsSentMin);
      if (emailsSentMax) query["emailStats.emailsSent"].$lte = parseInt(emailsSentMax);
    }

    if (doNotContact !== undefined) query["flags.doNotContact"] = doNotContact === "true";
    if (bounced !== undefined) query["flags.bounced"] = bounced === "true";
    if (unsubscribe !== undefined) query["flags.unsubscribe"] = unsubscribe === "true";

    if (company) {
      query.$or = [
        { companyName: { $regex: company, $options: "i" } },
        { companey_name: { $regex: company, $options: "i" } }
      ];
    }

    if (role) {
      query.$or = [
        { title: { $regex: role, $options: "i" } },
        { role: { $regex: role, $options: "i" } }
      ];
    }

    if (engagement) {
      query.engagement = { $in: engagement.split(",") };
    }

    if (source) {
      query.source = { $regex: source, $options: "i" };
    }

    if (last_reach_source) {
      query.last_reach_source = { $regex: last_reach_source, $options: "i" };
    }

    if (lastReachDateFrom || lastReachDateTo) {
      query.last_reach_date = {};
      if (lastReachDateFrom) query.last_reach_date.$gte = new Date(lastReachDateFrom);
      if (lastReachDateTo) query.last_reach_date.$lte = new Date(lastReachDateTo);
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const { purpose, excludeSequence, excludeRecent } = req.query;

    if (purpose) {
      if (purpose === "referral") {
        query.purpose = { $in: ["referral", "referall"] };
      } else {
        query.$or = [
          { purpose: "apply" },
          { purpose: { $exists: false } },
          { purpose: null }
        ];
      }
    }

    if (excludeSequence === "true") {
      const sequences = await Sequence.find({ status: { $ne: "stopped" } }).lean();
      const excludedIds = [];
      sequences.forEach(seq => {
        seq.contacts.forEach(c => {
          if (c.status !== "removed") {
            excludedIds.push(c.contactId);
          }
        });
      });
      if (excludedIds.length > 0) {
        query._id = { ...query._id, $nin: excludedIds };
      }
    }

    if (excludeRecent === "true") {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      query.lastSentDate = { ...query.lastSentDate, $lt: threeDaysAgo };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [contacts, total] = await Promise.all([
      Contact.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Contact.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: contacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
      appliedFilters: query,
    });
  } catch (error) {
    console.error("filterContacts error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/contacts/:id
export const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id).lean();
    if (!contact) {
      return res.status(404).json({ success: false, error: "Contact not found" });
    }
    res.json({ success: true, data: contact });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH /api/contacts/:id
export const updateContact = async (req, res) => {
  try {
    const mappedBody = mapIncomingContactFields(req.body);
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { $set: mappedBody },
      { new: true, runValidators: true }
    );
    if (!contact) {
      return res.status(404).json({ success: false, error: "Contact not found" });
    }
    res.json({ success: true, data: contact });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH /api/contacts/bulk
export const bulkUpdateContacts = async (req, res) => {
  try {
    const { ids, update } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: "ids array required" });
    }

    const result = await Contact.updateMany(
      { _id: { $in: ids } },
      { $set: update },
      { runValidators: true }
    );

    res.json({
      success: true,
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/contacts/stats - dashboard stats
export const getContactStats = async (req, res) => {
  try {
    const [
      total,
      statusCounts,
      repliedCount,
      bouncedCount,
      doNotContactCount,
    ] = await Promise.all([
      Contact.countDocuments(),
      Contact.aggregate([
        { $group: { _id: "$outreachStatus", count: { $sum: 1 } } },
      ]),
      Contact.countDocuments({ "reply.replied": true }),
      Contact.countDocuments({ "flags.bounced": true }),
      Contact.countDocuments({ "flags.doNotContact": true }),
    ]);

    const statusMap = {};
    statusCounts.forEach((s) => {
      statusMap[s._id || "NOT_SET"] = s.count;
    });

    res.json({
      success: true,
      data: {
        total,
        statusBreakdown: statusMap,
        replied: repliedCount,
        bounced: bouncedCount,
        doNotContact: doNotContactCount,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
