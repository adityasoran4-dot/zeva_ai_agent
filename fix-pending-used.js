// Fix incorrect pendingUsed values in billings
// Run this once to clean up bad data from previous logic

import mongoose from 'mongoose';

async function fixPendingUsed() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/zeva', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const Billing = mongoose.model('Billing', new mongoose.Schema({
      pending: Number,
      pendingUsed: Number,
      amount: Number,
      paid: Number,
      advanceUsed: Number,
      pastAdvanceUsed: Number,
    }, { strict: false }));

    console.log('Finding billings with incorrect pendingUsed...');

    // Find all billings where pendingUsed > 0
    const billingsWithPendingUsed = await Billing.find({ pendingUsed: { $gt: 0 } }).lean();
    
    console.log(`Found ${billingsWithPendingUsed.length} billings with pendingUsed > 0`);

    // Check each billing to see if pendingUsed is incorrectly calculated
    const fixedCount = [];
    
    for (const billing of billingsWithPendingUsed) {
      const oldPendingUsed = billing.pendingUsed || 0;
      
      // The correct logic: pendingUsed should only be set when explicitly paying off OLD pending
      // For normal billings, it should be 0
      // If pendingUsed equals (amount - pending), it's the old incorrect calculation
      const incorrectCalculation = billing.amount - (billing.pending || 0);
      
      if (Math.abs(oldPendingUsed - incorrectCalculation) < 0.01 && oldPendingUsed > 0) {
        console.log(`\nFixing billing ${billing._id}:`);
        console.log(`  Amount: ${billing.amount}, Pending: ${billing.pending}`);
        console.log(`  Old pendingUsed: ${oldPendingUsed} (INCORRECT)`);
        console.log(`  Setting pendingUsed to: 0`);
        
        await Billing.updateOne(
          { _id: billing._id },
          { $set: { pendingUsed: 0 } }
        );
        
        fixedCount.push(billing._id);
      }
    }

    console.log(`\n✅ Fixed ${fixedCount.length} billings`);
    console.log('Done!');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error fixing pendingUsed:', error);
    process.exit(1);
  }
}

fixPendingUsed();
