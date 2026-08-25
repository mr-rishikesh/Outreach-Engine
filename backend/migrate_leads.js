import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, ".env") });

const DEFAULT_SOURCE_URI = "mongodb+srv://mrrishikesh2_db_user:qP9ir3ns0hlQDJ5D@cluster0.axlzsbl.mongodb.net/users";
const SOURCE_URI = process.argv[2] || DEFAULT_SOURCE_URI;
const TARGET_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/outreach-crm";

async function migrate() {
  console.log("🚀 Starting Lead Migration...");
  console.log(`Source DB URI: ${SOURCE_URI}`);
  console.log(`Target DB URI: ${TARGET_URI.replace(/:([^:@]+)@/, ":****@")}`); // Hide credentials in logs

  let sourceConn, targetConn;

  try {
    console.log("🔌 Connecting to Source DB...");
    sourceConn = await mongoose.createConnection(SOURCE_URI).asPromise();
    console.log("✅ Connected to Source DB.");

    console.log("🔌 Connecting to Target DB...");
    targetConn = await mongoose.createConnection(TARGET_URI).asPromise();
    console.log("✅ Connected to Target DB.");

    const sourceCol = sourceConn.db.collection("contacts");
    const targetCol = targetConn.db.collection("contacts");

    console.log("📥 Fetching source contacts...");
    const sourceContacts = await sourceCol.find().toArray();
    console.log(`📊 Found ${sourceContacts.length} contacts in Source DB.`);

    console.log("📥 Fetching target contacts...");
    const targetContacts = await targetCol.find({}, { projection: { email: 1 } }).toArray();
    console.log(`📊 Found ${targetContacts.length} contacts in Target DB.`);

    // Create a set of lowercase target emails for O(1) lookup
    const targetEmails = new Set();
    for (const c of targetContacts) {
      if (c.email) {
        targetEmails.add(c.email.toLowerCase().trim());
      }
    }

    const toImport = [];
    let skippedExist = 0;
    let skippedNoEmail = 0;

    for (const doc of sourceContacts) {
      if (!doc.email) {
        skippedNoEmail++;
        continue;
      }

      const emailKey = doc.email.toLowerCase().trim();
      if (targetEmails.has(emailKey)) {
        skippedExist++;
      } else {
        // Prepare the document to insert exactly as it is in the source database.
        // We do not modify or add default fields, keeping the state identical.
        toImport.push(doc);
      }
    }

    console.log(`\nMigration Plan Summary:`);
    console.log(`- Contacts to import: ${toImport.length}`);
    console.log(`- Contacts skipped (email already exists): ${skippedExist}`);
    console.log(`- Contacts skipped (no email field): ${skippedNoEmail}`);

    if (toImport.length > 0) {
      console.log(`✍️ Inserting ${toImport.length} contacts into Target DB...`);
      
      // We use raw insertMany to bypass Mongoose schemas, hooks, validations, and default values.
      const result = await targetCol.insertMany(toImport);
      console.log(`✅ Successfully imported ${result.insertedCount} contacts.`);
    } else {
      console.log("ℹ️ No new contacts to import.");
    }

  } catch (error) {
    console.error("❌ Migration failed with error:", error);
  } finally {
    if (sourceConn) {
      await sourceConn.close();
      console.log("🔌 Source DB connection closed.");
    }
    if (targetConn) {
      await targetConn.close();
      console.log("🔌 Target DB connection closed.");
    }
    console.log("🏁 Migration process finished.");
  }
}

migrate();
