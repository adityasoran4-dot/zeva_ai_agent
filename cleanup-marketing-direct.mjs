import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ClinicNavigationItem from './models/ClinicNavigationItem.js';

dotenv.config();

async function main() {
  try {
    console.log('Connecting to MongoDB...');
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('Please define MONGODB_URI in your .env file');
    }

    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      dbName: 'web',
    });
    console.log('Connected to MongoDB successfully!');

    // Sub-modules we want to REMOVE from Marketing
    const removeSubModuleNames = [
      "Create Agent", 
      "Create Offers", 
      "Job", 
      "Blogs"
    ];

    const role = 'clinic'; // or 'doctor' or 'admin'
    const results = [];

    // Get all Marketing modules for the role
    const marketingModules = await ClinicNavigationItem.find({
      role: role,
      moduleKey: { $regex: /_marketing$/i }
    });

    console.log(`Found ${marketingModules.length} Marketing modules for role: ${role}`);

    for (const marketingModule of marketingModules) {
      if (marketingModule.subModules && marketingModule.subModules.length > 0) {
        // Filter out the sub-modules we want to remove
        const filteredSubModules = marketingModule.subModules.filter(sub => 
          !removeSubModuleNames.some(removeName => 
            sub.name.toLowerCase().includes(removeName.toLowerCase())
          )
        );

        const removedCount = marketingModule.subModules.length - filteredSubModules.length;

        if (removedCount > 0) {
          marketingModule.subModules = filteredSubModules;
          await marketingModule.save();
          results.push({
            moduleKey: marketingModule.moduleKey,
            removedCount: removedCount,
            keptCount: filteredSubModules.length
          });
          console.log(`✅ Updated ${marketingModule.moduleKey}: removed ${removedCount} sub-modules, kept ${filteredSubModules.length}`);
        } else {
          console.log(`ℹ️ No sub-modules to remove from ${marketingModule.moduleKey}`);
        }
      }
    }

    console.log('\n🎉 Cleanup complete!');
    console.log('Results:', JSON.stringify(results, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

main();
