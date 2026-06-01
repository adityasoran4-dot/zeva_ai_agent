//migrate-leads.mjs
import dotenv from "dotenv";
// dotenv.config({ path: ".env" }); 
dotenv.config({ path: '/home/Ayurveda-2/.env' });
console.log("Loaded MONGODB_URI:", process.env.MONGODB_URI);
import mongoose from "mongoose";
import dbConnect from "./lib/database.js";
import Lead from "./models/Lead.js";

(async () => {
  try {
    await dbConnect();

    const leads = await Lead.find({});

    for (const lead of leads) {
      if (lead.treatments.length > 0 && typeof lead.treatments[0] === "object" && lead.treatments[0].treatment) {
        // Already migrated
        continue;
      }

      const newTreatments = lead.treatments.map((t) => ({
        treatment: t, // previously just ObjectId
        subTreatment: null,
      }));

      lead.treatments = newTreatments;
      await lead.save();
      console.log(`Migrated lead ${lead._id}`);
    }

    console.log("✅ Migration complete");
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
})();
