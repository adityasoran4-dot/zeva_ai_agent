// Script to add Purchase Returns submodule to Clinic Stock module
// Run this script with: node scripts/add-purchase-return-submodule.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// ClinicNavigationItem Schema
const ClinicNavigationItemSchema = new mongoose.Schema({
  label: { type: String, required: true },
  path: { type: String, default: '' },
  icon: { type: String, required: true },
  description: { type: String, default: '' },
  badge: { type: Number, default: null },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClinicNavigationItem', default: null },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  moduleKey: { type: String, required: true },
  role: { type: String, enum: ['admin', 'clinic', 'doctor'], required: true },
  subModules: [{
    name: { type: String, required: true },
    path: { type: String },
    icon: { type: String, required: true },
    order: { type: Number, default: 0 },
    moduleKey: { type: String, required: true }
  }]
}, { timestamps: true });

const ClinicNavigationItem = mongoose.models.ClinicNavigationItem || 
  mongoose.model('ClinicNavigationItem', ClinicNavigationItemSchema);

// Main function
const addPurchaseReturnSubmodule = async () => {
  try {
    await connectDB();

    console.log('\n🔍 Searching for clinic_stock module...');
    
    // Find the clinic_stock module
    const clinicStockModule = await ClinicNavigationItem.findOne({
      moduleKey: 'clinic_stock',
      role: 'clinic',
      isActive: true
    });

    if (!clinicStockModule) {
      console.error('❌ Clinic Stock module not found!');
      console.log('Please make sure the clinic_stock module exists in the database.');
      process.exit(1);
    }

    console.log(`✅ Found clinic_stock module: ${clinicStockModule._id}`);
    console.log(`📊 Current subModules count: ${clinicStockModule.subModules.length}`);

    // Check if submodule already exists
    const existingSubmodule = clinicStockModule.subModules.find(
      sub => sub.moduleKey === 'clinic_stock_purchase_return'
    );

    if (existingSubmodule) {
      console.log('\n⚠️  Submodule already exists!');
      console.log('Existing submodule:', existingSubmodule);
      process.exit(0);
    }

    // Add the new submodule
    const newSubmodule = {
      name: 'Purchase Returns',
      path: '/clinic/stocks/purchase-returns',
      icon: '↩️',
      order: 13,
      moduleKey: 'clinic_stock_purchase_return'
    };

    console.log('\n➕ Adding new submodule...');
    console.log('Submodule details:', newSubmodule);

    clinicStockModule.subModules.push(newSubmodule);
    await clinicStockModule.save();

    console.log('\n✅ Success! Submodule added successfully');
    console.log(`📊 Total subModules now: ${clinicStockModule.subModules.length}`);
    console.log('\n📋 All subModules:');
    clinicStockModule.subModules.forEach((sub, index) => {
      console.log(`  ${index + 1}. ${sub.name} (${sub.moduleKey}) - ${sub.path}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

// Run the script
addPurchaseReturnSubmodule();
