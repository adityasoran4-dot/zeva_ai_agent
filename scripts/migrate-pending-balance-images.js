/**
 * Migration script to add pendingBalanceImage field to all existing billing records
 * Run this once to ensure the field exists in the database
 * 
 * Usage: node scripts/migrate-pending-balance-images.js
 */

require("dotenv").config();
const mongoose = require("mongoose");

async function migratePendingBalanceImages() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/zeva");
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    const collection = db.collection("billings");

    // Check how many documents exist
    const totalDocs = await collection.countDocuments();
    console.log(`📊 Total billing records found: ${totalDocs}`);

    if (totalDocs === 0) {
      console.log("⚠️  No billing records found. Migration not needed.");
      process.exit(0);
    }

    // Update all documents that don't have pendingBalanceImage field
    const result = await collection.updateMany(
      {
        pendingBalanceImage: { $exists: false },
      },
      {
        $set: { pendingBalanceImage: [] },
      }
    );

    console.log("\n✅ Migration completed!");
    console.log(`📝 Modified: ${result.modifiedCount} documents`);
    console.log(`📋 Matched: ${result.matchedCount} documents`);

    // Verify a sample document
    const sampleDoc = await collection.findOne({}).lean();
    console.log("\n Sample document structure:");
    console.log({
      _id: sampleDoc._id,
      patientId: sampleDoc.patientId,
      pendingBalanceImage: sampleDoc.pendingBalanceImage,
      hasField: "pendingBalanceImage" in sampleDoc,
    });

    console.log("\n✨ Migration successful!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

migratePendingBalanceImages();
