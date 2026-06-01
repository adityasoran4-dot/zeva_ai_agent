/**
 * Migration script to add cashbackStartDate and cashbackEndDate fields to existing billing records
 * 
 * Usage: node scripts/migrate-cashback-dates.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

async function migrateCashbackDates() {
  console.log('\n🚀 Starting migration: Adding cashbackStartDate and cashbackEndDate fields...\n');

  const Billing = require('../models/Billing');
  const CreateOffer = require('../models/CreateOffer');

  try {
    // Find all billings with cashback applied but no dates
    const billings = await Billing.find({
      isCashbackApplied: true,
      cashbackAmount: { $gt: 0 },
      $or: [
        { cashbackStartDate: null },
        { cashbackEndDate: null },
        { cashbackStartDate: { $exists: false } },
        { cashbackEndDate: { $exists: false } }
      ]
    });

    console.log(`📊 Found ${billings.length} billing(s) to migrate\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const billing of billings) {
      // If no cashbackOfferId, skip
      if (!billing.cashbackOfferId) {
        console.log(`⏭️  Skipped: ${billing.invoiceNumber} (no cashbackOfferId)`);
        skippedCount++;
        continue;
      }

      // Fetch the offer to get cashbackExpiryDays
      const cashbackOffer = await CreateOffer.findById(billing.cashbackOfferId);
      if (!cashbackOffer) {
        console.log(`⏭️  Skipped: ${billing.invoiceNumber} (offer not found)`);
        skippedCount++;
        continue;
      }

      const cashbackExpiryDays = cashbackOffer.cashbackExpiryDays || 365;

      // Calculate dates based on invoicedDate
      const startDate = new Date(billing.invoicedDate);
      const endDate = new Date(billing.invoicedDate);
      endDate.setDate(endDate.getDate() + cashbackExpiryDays);

      // Update the billing record
      await Billing.findByIdAndUpdate(billing._id, {
        $set: {
          cashbackStartDate: startDate,
          cashbackEndDate: endDate
        }
      });

      console.log(`✅ Updated: ${billing.invoiceNumber}`);
      console.log(`   - Cashback Amount: ${billing.cashbackAmount}`);
      console.log(`   - Expiry Days: ${cashbackExpiryDays}`);
      console.log(`   - Start Date: ${startDate.toISOString().split('T')[0]}`);
      console.log(`   - End Date: ${endDate.toISOString().split('T')[0]}\n`);

      updatedCount++;
    }

    console.log('\n📋 Migration Summary:');
    console.log(`   ✅ Updated: ${updatedCount} billing(s)`);
    console.log(`   ⏭️  Skipped: ${skippedCount} billing(s)`);
    console.log(`   📊 Total processed: ${billings.length} billing(s)\n`);

    // Verify a sample
    if (updatedCount > 0) {
      const sample = await Billing.findOne({
        isCashbackApplied: true,
        cashbackAmount: { $gt: 0 },
        cashbackStartDate: { $ne: null },
        cashbackEndDate: { $ne: null }
      }).lean();

      if (sample) {
        console.log('✅ Sample verification:');
        console.log(`   - Invoice: ${sample.invoiceNumber}`);
        console.log(`   - cashbackStartDate: ${sample.cashbackStartDate}`);
        console.log(`   - cashbackEndDate: ${sample.cashbackEndDate}`);
        console.log(`   - Has cashbackStartDate field: ${'cashbackStartDate' in sample}`);
        console.log(`   - Has cashbackEndDate field: ${'cashbackEndDate' in sample}\n`);
      }
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    process.exit(0);
  }
}

// Run migration
migrateCashbackDates();
