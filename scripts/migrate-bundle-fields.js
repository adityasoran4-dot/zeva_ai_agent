/**
 * Migration Script: Add bundle offer fields to Billing collection
 * Run this once to update existing Billing documents with new fields
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zeva360';

async function migrateBillingModel() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully!');

    const db = mongoose.connection.db;
    const collection = db.collection('billings');

    console.log('\nChecking current schema...');
    const sampleDoc = await collection.findOne({});
    console.log('Sample document keys:', Object.keys(sampleDoc || {}));

    // Check if fields already exist
    const hasOfferFreeSession = sampleDoc && 'offerFreeSession' in sampleDoc;
    const hasFreeOfferSessionCount = sampleDoc && 'freeOfferSessionCount' in sampleDoc;

    if (hasOfferFreeSession && hasFreeOfferSessionCount) {
      console.log('\n✅ Fields already exist in the collection!');
      console.log('Sample offerFreeSession:', sampleDoc.offerFreeSession);
      console.log('Sample freeOfferSessionCount:', sampleDoc.freeOfferSessionCount);
    } else {
      console.log('\n⚠️  Fields not found. Adding default values to all documents...');
      
      // Update all documents to include the new fields with default values
      const result = await collection.updateMany(
        {
          $or: [
            { offerFreeSession: { $exists: false } },
            { freeOfferSessionCount: { $exists: false } }
          ]
        },
        {
          $set: {
            offerFreeSession: [],
            freeOfferSessionCount: 0
          }
        }
      );

      console.log(`\n✅ Updated ${result.modifiedCount} documents`);
      console.log(`   Matched: ${result.matchedCount}`);
      console.log(`   Modified: ${result.modifiedCount}`);

      // Verify the update
      const updatedDoc = await collection.findOne({});
      console.log('\nUpdated sample document:');
      console.log('  offerFreeSession:', updatedDoc.offerFreeSession);
      console.log('  freeOfferSessionCount:', updatedDoc.freeOfferSessionCount);
    }

    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

migrateBillingModel();
