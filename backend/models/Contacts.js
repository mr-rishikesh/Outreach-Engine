import mongoose from "mongoose";
import Counter from "./Counter.js";

const contactSchema = new mongoose.Schema({
  lastSentDate : { type: Date ,    default: () => {
      const today = new Date();
      today.setDate(today.getDate() - 100); 
      return today;
    }}, // imp
  firstName: String,
  lastName: String,
  title: String,
  companyName: String,
  companyNameForEmails: String,
  email: String,
  emailStatus: String,
  primaryEmailSource: String,
  primaryEmailVerificationSource: String,
  emailConfidence: Number,
  primaryEmailCatchAllStatus: String,
  primaryEmailLastVerifiedAt: String,
  departments: String,
  contactOwner: String,
  workDirectPhone: String,
  homePhone: String,
  mobilePhone: String,
  corporatePhone: String,
  otherPhone: String,
  stage: String,
  lists: String,
  lastContacted: String,
  accountOwner: String,
  employees: String,
  industry: String,
  keywords: String,
  personLinkedinUrl: String,
  website: String,
  companyLinkedinUrl: String,
  facebookUrl: String,
  twitterUrl: String,
  city: String,
  state: String,
  country: String,
  companyAddress: String,
  companyCity: String,
  companyState: String,
  companyCountry: String,
  companyPhone: String,
  technologies: String,
  annualRevenue: String,
  totalFunding: String,
  latestFunding: String,
  latestFundingAmount: String,
  lastRaisedAt: String,
  subsidiaryOf: String,
  emailSent: String,
  emailOpen: String,
  emailBounced: String,
  replied: String,
  demoed: String,
  numberOfRetailLocations: String,
  apolloContactId: String,
  apolloAccountId: String,
  secondaryEmail: String,
  secondaryEmailSource: String,
  secondaryEmailStatus: String,
  secondaryEmailVerificationSource: String,
  tertiaryEmail: String,
  tertiaryEmailSource: String,
  tertiaryEmailStatus: String,
  tertiaryEmailVerificationSource: String,
    // outreach status
  outreachStatus: {
    type: String,
    enum: [
      "NOT_SENT",
      "SENT",
      "FOLLOWUP_PENDING",
      "REPLIED_POSITIVE",
      "REPLIED_NEGATIVE",
      "NO_RESPONSE",
      "CLOSED"
    ],
    default: "NOT_SENT"
  },

  // reply tracking
  reply: {
    replied: {
      type: Boolean,
      default: false
    },

    replyType: {
      type: String,
      enum: ["positive", "negative", "neutral"],
      default: null
    },

    replyMessage: String,

    repliedAt: Date
  },

  // followup tracking
  followup: {
    followupCount: {
      type: Number,
      default: 0
    },

    maxFollowups: {
      type: Number,
      default: 3
    },

    nextFollowupAt: Date,

    followupEnabled: {
      type: Boolean,
      default: true
    }
  },

  // email tracking
  emailStats: {
    emailsSent: {
      type: Number,
      default: 0
    },

    opened: {
      type: Boolean,
      default: false
    },

    openedCount: {
      type: Number,
      default: 0
    },

    lastOpenedAt: Date
  },

  // email history
  emails: [
    {
      type: {
        type: String
      },

      subject: String,

      sentAt: Date
    }
  ],

  // flags
  flags: {
    doNotContact: {
      type: Boolean,
      default: false
    },

    bounced: {
      type: Boolean,
      default: false
    },

    unsubscribe: {
      type: Boolean,
      default: false
    }
  },

  // notes
  notes: {
    type: String,
    default: "MARCH17-26"
  },

  // Enhanced CRM fields
  last_reach_date: {
    type: Date,
    default: null
  },
  last_reach_message: {
    type: String,
    default: ""
  },
  last_reach_source: {
    type: String,
    default: ""
  },
  source: {
    type: String,
    default: ""
  },
  engagement: {
    type: String,
    enum: ["High", "Medium", "Low"],
    default: "Low"
  },
  phone: {
    type: String,
    default: ""
  },
  linkedin: {
    type: String,
    default: ""
  },
  insta: {
    type: String,
    default: ""
  },
  twitter: {
    type: String,
    default: ""
  },
  companey_name: {
    type: String,
    default: ""
  },
  companey_url: {
    type: String,
    default: ""
  },
  role: {
    type: String,
    default: ""
  },
  purpose: {
    type: String,
    enum: ["apply", "referral", "referall"],
    default: "apply"
  },
  leadId: {
    type: String,
    unique: true,
    sparse: true
  },
  sequence_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Sequence",
    default: null
  },
  batch_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Batch",
    default: null
  },
  next_send_date: {
    type: Date,
    default: null
  },
  next_send_type: {
    type: String,
    enum: ["email", "followup", null],
    default: null
  }

}, { timestamps: true });

contactSchema.pre("save", async function (next) {
  if (!this.leadId) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { id: "leadId" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.leadId = `LD-${10000 + counter.seq}`;
    } catch (err) {
      return next(err);
    }
  }

  // Auto-spawn associated Company profile if it does not exist
  const companyName = this.companyName;
  if (companyName) {
    try {
      const Company = mongoose.model("Company");
      const existing = await Company.findOne({ name: { $regex: new RegExp(`^${companyName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } });
      if (!existing) {
        await Company.create({
          name: companyName,
          industry: this.industry || "",
          employees: this.employees || "",
          city: this.city || "",
          state: this.state || "",
          country: this.country || "",
          website: this.website || "",
          annualRevenue: this.annualRevenue || "",
          totalFunding: this.totalFunding || ""
        });
      }
    } catch (err) {
      console.error("⚠️ Failed to auto-spawn company on contact save:", err);
    }
  }

  next();
});

const ContactModel = mongoose.model("Contact", contactSchema);

export const backfillLeadIds = async () => {
  try {
    const contactsMissingLeadId = await ContactModel.find({
      $or: [
        { leadId: { $exists: false } },
        { leadId: null },
        { leadId: "" }
      ]
    });

    if (contactsMissingLeadId.length > 0) {
      console.log(`♻️ Found ${contactsMissingLeadId.length} contacts missing leadId. Backfilling...`);
      for (const contact of contactsMissingLeadId) {
        const counter = await Counter.findOneAndUpdate(
          { id: "leadId" },
          { $inc: { seq: 1 } },
          { new: true, upsert: true }
        );
        contact.leadId = `LD-${10000 + counter.seq}`;
        await contact.save();
      }
      console.log("✅ Backfill complete!");
    }
  } catch (error) {
    console.error("❌ Failed to backfill leadIds:", error);
  }
};

export default ContactModel;
