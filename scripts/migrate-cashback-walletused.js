#!/usr/bin/env node

/**
 * Migration Script: Add cashbackWalletUsed field to Billing model
 * 
 * This migration adds the cashbackWalletUsed field to all existing billing records
 * that don't have it yet. The field tracks how much cashback the patient used
 * from their wallet during billing.
 * 
 * Usage: node scripts/migrate-cashback-walletused.js
 */

const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zeva';

async function migrate() {
  console.log('🚀 Starting cashbackWalletUsed migration...\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Load Billing model
    const Billing = require('../models/Billing');

    // Check if field exists in schema
    const schemaFields = Object.keys(Billing.schema.paths);
    if (!schemaFields.includes('cashbackWalletUsed')) {
      console.error('❌ cashbackWalletUsed field not found in Billing schema!');
      console.log('Available fields:', schemaFields.join(', '));
      process.exit(1);
    }

    // Count documents that don't have the field
    const countWithoutField = await Billing.countDocuments({
      cashbackWalletUsed: { $exists: false }
    });

    console.log(`📊 Found ${countWithoutField} billing records without cashbackWalletUsed field\n`);

    if (countWithoutField === 0) {
      console.log('✅ All billing records already have cashbackWalletUsed field!\n');
      process.exit(0);
    }

    // Perform the migration
    const result = await Billing.updateMany(
      { cashbackWalletUsed: { $exists: false } },
      { $set: { cashbackWalletUsed: 0 } }
    );

    console.log(`✅ Migration completed successfully!`);
    console.log(`   - Matched: ${result.matchedCount}`);
    console.log(`   - Modified: ${result.modifiedCount}`);
    console.log(`   - Acknowledged: ${result.acknowledged}\n`);

    // Verify migration
    const afterCountWithoutField = await Billing.countDocuments({
      cashbackWalletUsed: { $exists: false }
    });

    const withField = await Billing.countDocuments({
      cashbackWalletUsed: { $exists: true }
    });

    const withValue = await Billing.countDocuments({
      cashbackWalletUsed: { $gt: 0 }
    });

    console.log('📈 Verification:');
    console.log(`   - Records with field: ${withField}`);
    console.log(`   - Records without field: ${afterCountWithoutField}`);
    console.log(`   - Records with value > 0: ${withValue}\n`);

    // Show sample of records with cashbackWalletUsed > 0
    if (withValue > 0) {
      const samples = await Billing.find({ cashbackWalletUsed: { $gt: 0 } })
        .select('invoiceNumber cashbackWalletUsed cashbackAmount isCashbackApplied')
        .limit(5)
        .lean();

      console.log('📋 Sample records with cashbackWalletUsed > 0:');
      samples.forEach((doc, idx) => {
        console.log(`   ${idx + 1}. ${doc.invoiceNumber}:`);
        console.log(`      - cashbackWalletUsed: ${doc.cashbackWalletUsed}`);
        console.log(`      - cashbackAmount: ${doc.cashbackAmount}`);
        console.log(`      - isCashbackApplied: ${doc.isCashbackApplied}`);
      });
      console.log('');
    }

    console.log('✅ Migration script completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed with error:');
    console.error(error);
    process.exit(1);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB\n');
  }
}

// Run migration
migrate();
