import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import csv from "csv-parser";
import fs from "fs";
import Contact from "./models/Contacts.js";
import { sendInternshipMail } from "./ai-service/service.js";
// import { sendEmail } from "./email-service/index.js";
import emailRouter from "./routes/email.router.js";
import contactRouter from "./routes/contact.router.js";
import apolloRouter from "./routes/apollo.router.js";

console.log("✅ Routers imported");

const app = express();
const PORT = 5000;

// CORS for all ports (development)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS, PUT");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(express.json());

// Test route
app.get("/test", (req, res) => {
  res.json({ message: "Server is working!" });
});

// Debug endpoint (before routes)
app.get("/debug/contacts-count", async (req, res) => {
  try {
    const count = await Contact.countDocuments();
    const sample = await Contact.findOne().lean();
    res.json({
      totalContacts: count,
      sampleContact: sample,
      mongoConnected: mongoose.connection.readyState === 1
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

console.log("📍 Registering routes...");
app.use("/email", emailRouter);
console.log("✅ Email router registered");
app.use("/api/contacts", contactRouter);
console.log("✅ Contact router registered");
app.use("/api/apollo", apolloRouter);
console.log("✅ Apollo router registered");

// MongoDB connect
mongoose.connect("mongodb+srv://mrrishikesh2_db_user:qP9ir3ns0hlQDJ5D@cluster0.axlzsbl.mongodb.net/us", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log("✅ MongoDB connected");
  // Debug: Check if data exists
  const count = await Contact.countDocuments();
  console.log(`📊 Total contacts in database: ${count}`);
})
  .catch(err => console.error("❌ MongoDB error:", err));

const upload = multer({ dest: "uploads/" });

// app.get("/res" ,async (req , res) => {
//   console.log("route");
  
//  const {subject , body } = await  sendInternshipMail();
//   try {
  
  
//   const {sucess} = await sendEmail({subject , body});

//   if(sucess) {
//     return  res.json({success : true , subject , body})
//   }
//   else {
//      return  res.json({success : false , subject , body})
//   }
//   } catch (error) {
//     console.log(error);
//     return;
//   }
  

// })
// Upload route
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }
    
    const filePath = req.file.path;
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv({
        mapHeaders: ({ header }) => header.toLowerCase().replace(/^\uFEFF/, '').trim()
      }))
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        try {
          let inserted = 0, skipped = 0;

          for (const record of results) {
            // Because we mapped headers to lowercase and trimmed them
            const apolloId = record["apollo contact id"];
            const recordEmail = record["email"];

            if (!apolloId && !recordEmail) {
              // Skip empty rows
              continue;
            }

            const filter = apolloId
              ? { apolloContactId: apolloId }
              : { email: recordEmail };

            // if exists → skip
            const existing = await Contact.findOne(filter);
            if (existing) {
              skipped++;
              continue;
            }

            // else insert
            await Contact.create({
              firstName: record["first name"],
              lastName: record["last name"],
              title: record["title"],
              companyName: record["company name"],
              companyNameForEmails: record["company name for emails"],
              email: recordEmail,
              emailStatus: record["email status"],
              primaryEmailSource: record["primary email source"],
              primaryEmailVerificationSource: record["primary email verification source"],
              emailConfidence: record["email confidence"],
              primaryEmailCatchAllStatus: record["primary email catch-all status"],
              primaryEmailLastVerifiedAt: record["primary email last verified at"],
              departments: record["departments"],
              contactOwner: record["contact owner"],
              workDirectPhone: record["work direct phone"],
              homePhone: record["home phone"],
              mobilePhone: record["mobile phone"],
              corporatePhone: record["corporate phone"],
              otherPhone: record["other phone"],
              stage: record["stage"],
              lists: record["lists"],
              lastContacted: record["last contacted"],
              accountOwner: record["account owner"],
              employees: record["# employees"],
              industry: record["industry"],
              keywords: record["keywords"],
              personLinkedinUrl: record["person linkedin url"],
              website: record["website"],
              companyLinkedinUrl: record["company linkedin url"],
              facebookUrl: record["facebook url"],
              twitterUrl: record["twitter url"],
              city: record["city"],
              state: record["state"],
              country: record["country"],
              companyAddress: record["company address"],
              companyCity: record["company city"],
              companyState: record["company state"],
              companyCountry: record["company country"],
              companyPhone: record["company phone"],
              technologies: record["technologies"],
              annualRevenue: record["annual revenue"],
              totalFunding: record["total funding"],
              latestFunding: record["latest funding"],
              latestFundingAmount: record["latest funding amount"],
              lastRaisedAt: record["last raised at"],
              subsidiaryOf: record["subsidiary of"],
              emailSent: record["email sent"],
              emailOpen: record["email open"],
              emailBounced: record["email bounced"],
              replied: record["replied"],
              demoed: record["demoed"],
              numberOfRetailLocations: record["number of retail locations"],
              apolloContactId: apolloId,
              apolloAccountId: record["apollo account id"],
              secondaryEmail: record["secondary email"],
              secondaryEmailSource: record["secondary email source"],
              secondaryEmailStatus: record["secondary email status"],
              secondaryEmailVerificationSource: record["secondary email verification source"],
              tertiaryEmail: record["tertiary email"],
              tertiaryEmailSource: record["tertiary email source"],
              tertiaryEmailStatus: record["tertiary email status"],
              tertiaryEmailVerificationSource: record["tertiary email verification source"]
            });

            inserted++;
          }

          res.json({ success: true, inserted, skipped, total: results.length });
        } catch (error) {
          console.error("Error during CSV processing:", error);
          if (!res.headersSent) {
            res.status(500).json({ success: false, error: "Server error during CSV processing", details: error.message });
          }
        } finally {
          try {
            fs.unlinkSync(filePath);
          } catch (unlinkError) {
            console.error("Failed to delete temp file:", unlinkError);
          }
        }
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// 404 handler for debugging
app.use((req, res) => {
  console.log(`⚠️ 404: ${req.method} ${req.path}`);
  res.status(404).json({ message: "Route not found" });
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
