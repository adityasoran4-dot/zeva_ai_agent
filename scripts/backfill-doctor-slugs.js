/**
 * Backfill Script for Doctor Slugs
 * 
 * This script generates slugs for existing approved doctors that don't have slugs yet.
 * Run this once after deploying the slug system to ensure all existing doctors have slugs.
 * 
 * Usage:
 *   node scripts/backfill-doctor-slugs.js
 * 
 * Options:
 *   --dry-run: Show what would be done without making changes
 *   --force: Force regeneration even if slug exists (not recommended)
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import dbConnect from '../lib/database.js';
import DoctorProfile from '../models/DoctorProfile.js';
import User from '../models/Users.js';
import { generateAndLockSlug } from '../lib/slugService.js';

const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');

async function backfillSlugs() {
  try {
    console.log('🔌 Connecting to database...');
    await dbConnect();
    console.log('✅ Connected to database\n');

    // Find all doctor profiles where user is approved but doctor doesn't have slug
    const doctorProfiles = await DoctorProfile.find({
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: '' },
        { slugLocked: { $ne: true } }
      ]
    }).populate('user', 'name isApproved').select('_id user slug slugLocked');
    
    // Filter to only approved doctors
    const approvedDoctors = doctorProfiles.filter(doc => doc.user?.isApproved === true);
    
    console.log(`📊 Found ${approvedDoctors.length} approved doctors that need slugs\n`);

    if (approvedDoctors.length === 0) {
      console.log('✅ All approved doctors already have slugs!');
      process.exit(0);
    }

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const doctor of approvedDoctors) {
      try {
        // Skip if slug exists and is locked (unless force is enabled)
        if (doctor.slug && doctor.slugLocked && !FORCE) {
          console.log(`⏭️  Skipping ${doctor.user?.name} (slug already locked: ${doctor.slug})`);
          skippedCount++;
          continue;
        }

        if (DRY_RUN) {
          console.log(`[DRY RUN] Would generate slug for: ${doctor.user?.name} (Profile ID: ${doctor._id})`);
          successCount++;
          continue;
        }

        console.log(`🔄 Generating slug for: ${doctor.user?.name}...`);
        
        const updatedDoctor = await generateAndLockSlug('doctor', doctor._id.toString(), {
          forceRegenerate: FORCE
        });

        if (updatedDoctor.slug && updatedDoctor.slugLocked) {
          console.log(`   ✅ Generated slug: ${updatedDoctor.slug}`);
          successCount++;
        } else {
          console.log(`   ⚠️  Slug generated but not locked: ${updatedDoctor.slug}`);
          successCount++;
        }
      } catch (error) {
        console.error(`   ❌ Error for ${doctor.user?.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📈 Summary:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📊 Total: ${approvedDoctors.length}`);

    if (DRY_RUN) {
      console.log('\n⚠️  This was a dry run. No changes were made.');
      console.log('   Run without --dry-run to apply changes.');
    }

    process.exit(errorCount > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
backfillSlugs();

