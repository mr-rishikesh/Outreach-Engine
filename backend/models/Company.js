import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  industry: {
    type: String,
    default: "",
  },
  employees: {
    type: String,
    default: "",
  },
  city: {
    type: String,
    default: "",
  },
  state: {
    type: String,
    default: "",
  },
  country: {
    type: String,
    default: "",
  },
  website: {
    type: String,
    default: "",
  },
  annualRevenue: {
    type: String,
    default: "",
  },
  totalFunding: {
    type: String,
    default: "",
  },
}, { timestamps: true });

const Company = mongoose.model("Company", companySchema);

export const backfillCompanies = async () => {
  try {
    const Contact = mongoose.model("Contact");
    const uniqueCompanies = await Contact.aggregate([
      {
        $group: {
          _id: { $trim: { input: { $toLower: "$companyName" } } },
          name: { $first: "$companyName" },
          industry: { $first: "$industry" },
          employees: { $first: "$employees" },
          city: { $first: "$city" },
          state: { $first: "$state" },
          country: { $first: "$country" },
          website: { $first: "$website" },
          annualRevenue: { $first: "$annualRevenue" },
          totalFunding: { $first: "$totalFunding" }
        }
      }
    ]);

    let inserted = 0;
    for (const comp of uniqueCompanies) {
      if (!comp.name) continue;
      const trimmedName = comp.name.trim();
      if (!trimmedName) continue;

      const existing = await Company.findOne({ name: { $regex: new RegExp(`^${trimmedName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } });
      if (!existing) {
        await Company.create({
          name: trimmedName,
          industry: comp.industry || "",
          employees: comp.employees || "",
          city: comp.city || "",
          state: comp.state || "",
          country: comp.country || "",
          website: comp.website || "",
          annualRevenue: comp.annualRevenue || "",
          totalFunding: comp.totalFunding || ""
        });
        inserted++;
      }
    }
    if (inserted > 0) {
      console.log(`✅ Backfilled ${inserted} unique companies from contacts database.`);
    }
  } catch (err) {
    console.error("❌ Failed to backfill companies:", err);
  }
};

export default Company;
