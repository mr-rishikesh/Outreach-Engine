import Contact from "../models/Contacts.js";

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
    console.error("getContacts error:", error);
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
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { companyName: { $regex: search, $options: "i" } },
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
      query.companyName = { $regex: company, $options: "i" };
    }

    if (role) {
      query.title = { $regex: role, $options: "i" };
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
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
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
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
