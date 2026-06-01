/**
 * Backfill Script for Clinic Slugs
 * 
 * This script generates slugs for existing approved clinics that don't have slugs yet.
 * Run this once after deploying the slug system to ensure all existing clinics have slugs.
 * 
 * Usage:
 *   node --experimental-modules scripts/backfill-clinic-slugs.js
 *   OR
 *   npm run backfill-slugs (if configured in package.json)
 * 
 * Options:
 *   --dry-run: Show what would be done without making changes
 *   --force: Force regeneration even if slug exists (not recommended)
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import dbConnect from '../lib/database.js';
import Clinic from '../models/Clinic.js';
import { generateAndLockSlug } from '../lib/slugService.js';

const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');

async function backfillSlugs() {
  try {
    console.log('🔌 Connecting to database...');
    await dbConnect();
    console.log('✅ Connected to database\n');

    // Find all approved clinics without slugs or with unlocked slugs
    const query = {
      isApproved: true,
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: '' },
        { slugLocked: { $ne: true } }
      ]
    };

    const clinics = await Clinic.find(query).select('_id name slug slugLocked isApproved');
    
    console.log(`📊 Found ${clinics.length} approved clinics that need slugs\n`);

    if (clinics.length === 0) {
      console.log('✅ All approved clinics already have slugs!');
      process.exit(0);
    }

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const clinic of clinics) {
      try {
        // Skip if slug exists and is locked (unless force is enabled)
        if (clinic.slug && clinic.slugLocked && !FORCE) {
          console.log(`⏭️  Skipping ${clinic.name} (slug already locked: ${clinic.slug})`);
          skippedCount++;
          continue;
        }

        if (DRY_RUN) {
          console.log(`[DRY RUN] Would generate slug for: ${clinic.name} (ID: ${clinic._id})`);
          successCount++;
          continue;
        }

        console.log(`🔄 Generating slug for: ${clinic.name}...`);
        
        const updatedClinic = await generateAndLockSlug('clinic', clinic._id.toString(), {
          forceRegenerate: FORCE
        });

        if (updatedClinic.slug && updatedClinic.slugLocked) {
          console.log(`   ✅ Generated slug: ${updatedClinic.slug}`);
          successCount++;
        } else {
          console.log(`   ⚠️  Slug generated but not locked: ${updatedClinic.slug}`);
          successCount++;
        }
      } catch (error) {
        console.error(`   ❌ Error for ${clinic.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📈 Summary:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📊 Total: ${clinics.length}`);

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

