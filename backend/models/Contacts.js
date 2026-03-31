import mongoose from "mongoose";

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
  }

}, { timestamps: true });

export default mongoose.model("Contact", contactSchema);
