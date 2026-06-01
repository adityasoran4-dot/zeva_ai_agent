/**
 * Migration Script: Add cashback fields to Billing collection
 * Run this once to update existing Billing documents with new cashback fields
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zeva360';

async function migrateBillingCashbackFields() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully!');

    const db = mongoose.connection.db;
    const collection = db.collection('billings');

    console.log('\nChecking current schema...');
    const sampleDoc = await collection.findOne({});
    console.log('Sample document keys:', Object.keys(sampleDoc || {}));

    // Check if cashback fields already exist
    const hasIsCashbackApplied = sampleDoc && 'isCashbackApplied' in sampleDoc;
    const hasCashbackOfferId = sampleDoc && 'cashbackOfferId' in sampleDoc;
    const hasCashbackOfferName = sampleDoc && 'cashbackOfferName' in sampleDoc;
    const hasCashbackAmount = sampleDoc && 'cashbackAmount' in sampleDoc;

    if (hasIsCashbackApplied && hasCashbackOfferId && hasCashbackOfferName && hasCashbackAmount) {
      console.log('\n✅ All cashback fields already exist in the collection!');
      console.log('Sample cashback fields:');
      console.log('  isCashbackApplied:', sampleDoc.isCashbackApplied);
      console.log('  cashbackOfferId:', sampleDoc.cashbackOfferId);
      console.log('  cashbackOfferName:', sampleDoc.cashbackOfferName);
      console.log('  cashbackAmount:', sampleDoc.cashbackAmount);
    } else {
      console.log('\n⚠️  Cashback fields not found. Adding default values to all documents...');
      
      // Update all documents to include the new cashback fields with default values
      const updateFields = {};
      if (!hasIsCashbackApplied) updateFields.isCashbackApplied = false;
      if (!hasCashbackOfferId) updateFields.cashbackOfferId = null;
      if (!hasCashbackOfferName) updateFields.cashbackOfferName = null;
      if (!hasCashbackAmount) updateFields.cashbackAmount = 0;

      if (Object.keys(updateFields).length > 0) {
        const result = await collection.updateMany(
          {},
          { $set: updateFields }
        );

        console.log(`\n✅ Updated ${result.modifiedCount} documents`);
        console.log(`   Matched: ${result.matchedCount}`);
        console.log(`   Modified: ${result.modifiedCount}`);
        console.log('\nFields added:');
        Object.keys(updateFields).forEach(key => {
          console.log(`   ${key}: ${updateFields[key]}`);
        });

        // Verify the update
        const updatedDoc = await collection.findOne({});
        console.log('\nUpdated sample document:');
        console.log('  isCashbackApplied:', updatedDoc.isCashbackApplied);
        console.log('  cashbackOfferId:', updatedDoc.cashbackOfferId);
        console.log('  cashbackOfferName:', updatedDoc.cashbackOfferName);
        console.log('  cashbackAmount:', updatedDoc.cashbackAmount);
      } else {
        console.log('\n⚠️  No fields to update');
      }
    }

    // Also update PatientRegistration model with wallet fields
    console.log('\n\nUpdating PatientRegistration model...');
    const patientCollection = db.collection('patientregistrations');
    
    const patientSample = await patientCollection.findOne({});
    const hasWalletBalance = patientSample && 'walletBalance' in patientSample;
    const hasWalletCreditExpiry = patientSample && 'walletCreditExpiry' in patientSample;
    const hasWalletTransactions = patientSample && 'walletTransactions' in patientSample;

    if (hasWalletBalance && hasWalletCreditExpiry && hasWalletTransactions) {
      console.log('✅ Wallet fields already exist in PatientRegistration!');
      console.log('Sample wallet fields:');
      console.log('  walletBalance:', patientSample.walletBalance);
      console.log('  walletCreditExpiry:', patientSample.walletCreditExpiry);
      console.log('  walletTransactions:', patientSample.walletTransactions?.length || 0);
    } else {
      console.log('⚠️  Wallet fields not found. Adding default values to all patient records...');
      
      const patientUpdateFields = {};
      if (!hasWalletBalance) patientUpdateFields.walletBalance = 0;
      if (!hasWalletCreditExpiry) patientUpdateFields.walletCreditExpiry = null;
      if (!hasWalletTransactions) patientUpdateFields.walletTransactions = [];

      if (Object.keys(patientUpdateFields).length > 0) {
        const result = await patientCollection.updateMany(
          {},
          { $set: patientUpdateFields }
        );

        console.log(`\n✅ Updated ${result.modifiedCount} patient records`);
        console.log('Fields added:');
        Object.keys(patientUpdateFields).forEach(key => {
          console.log(`   ${key}: ${JSON.stringify(patientUpdateFields[key])}`);
        });
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\nSummary:');
    console.log('- Billing model: Added isCashbackApplied, cashbackOfferId, cashbackOfferName, cashbackAmount');
    console.log('- PatientRegistration model: Added walletBalance, walletCreditExpiry, walletTransactions');
    console.log('\nYou can now use cashback offers in billing!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

migrateBillingCashbackFields();
