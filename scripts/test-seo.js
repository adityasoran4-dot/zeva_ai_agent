/**
 * SEO System Test Script
 * 
 * Run: node scripts/test-seo.js [clinic-id] [doctor-id]
 * 
 * Tests:
 * 1. Indexing decision
 * 2. Meta tags generation
 * 3. Canonical URL
 * 4. Sitemap files
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const { runSEOPipeline, quickSEOCheck } = require('../lib/seo/SEOOrchestrator');
const { updateSitemaps } = require('../lib/seo/SitemapService');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI;

async function testSEO() {
  try {
    // Connect to database
    console.log('🔌 Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to database\n');

    const [clinicId, doctorId] = process.argv.slice(2);

    if (clinicId) {
      console.log('🏥 Testing Clinic SEO Pipeline');
      console.log('='.repeat(50));
      console.log(`Clinic ID: ${clinicId}\n`);

      const result = await runSEOPipeline('clinic', clinicId);
      
      console.log('\n📊 Results:');
      console.log(`  Success: ${result.success ? '✅' : '❌'}`);
      console.log(`  Should Index: ${result.indexing?.shouldIndex ? '✅ Yes' : '❌ No'}`);
      console.log(`  Reason: ${result.indexing?.reason}`);
      console.log(`  Priority: ${result.indexing?.priority}`);
      console.log(`  Robots: ${result.robots?.content}`);
      console.log(`  Title: ${result.meta?.title || 'N/A'}`);
      console.log(`  Canonical: ${result.canonical || 'N/A'}`);
      
      if (result.warnings && result.warnings.length > 0) {
        console.log(`\n⚠️  Warnings:`);
        result.warnings.forEach(w => console.log(`  - ${w}`));
      }
      
      if (result.errors && result.errors.length > 0) {
        console.log(`\n❌ Errors:`);
        result.errors.forEach(e => console.log(`  - ${e}`));
      }
    }

    if (doctorId) {
      console.log('\n\n👨‍⚕️ Testing Doctor SEO Pipeline');
      console.log('='.repeat(50));
      console.log(`Doctor ID: ${doctorId}\n`);

      const result = await runSEOPipeline('doctor', doctorId);
      
      console.log('\n📊 Results:');
      console.log(`  Success: ${result.success ? '✅' : '❌'}`);
      console.log(`  Should Index: ${result.indexing?.shouldIndex ? '✅ Yes' : '❌ No'}`);
      console.log(`  Reason: ${result.indexing?.reason}`);
      console.log(`  Priority: ${result.indexing?.priority}`);
      console.log(`  Robots: ${result.robots?.content}`);
      console.log(`  Title: ${result.meta?.title || 'N/A'}`);
      console.log(`  Canonical: ${result.canonical || 'N/A'}`);
      
      if (result.warnings && result.warnings.length > 0) {
        console.log(`\n⚠️  Warnings:`);
        result.warnings.forEach(w => console.log(`  - ${w}`));
      }
      
      if (result.errors && result.errors.length > 0) {
        console.log(`\n❌ Errors:`);
        result.errors.forEach(e => console.log(`  - ${e}`));
      }
    }

    // Test sitemap files
    console.log('\n\n🗺️  Testing Sitemap Files');
    console.log('='.repeat(50));
    
    const sitemapDir = path.join(process.cwd(), 'public');
    const files = ['sitemap-clinics.xml', 'sitemap-doctors.xml', 'sitemap.xml'];
    
    files.forEach(file => {
      const filePath = path.join(sitemapDir, file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const size = (stats.size / 1024).toFixed(2);
        console.log(`  ✅ ${file} (${size} KB)`);
      } else {
        console.log(`  ❌ ${file} (not found)`);
      }
    });

    // Test sitemap update
    console.log('\n🔄 Testing Sitemap Update...');
    const sitemapResult = await updateSitemaps();
    if (sitemapResult.success) {
      console.log(`  ✅ Sitemaps updated successfully`);
      console.log(`  Files: ${sitemapResult.files.join(', ')}`);
    } else {
      console.log(`  ❌ Sitemap update failed: ${sitemapResult.error}`);
    }

    console.log('\n✅ Test completed!\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run test
if (require.main === module) {
  const [clinicId, doctorId] = process.argv.slice(2);
  
  if (!clinicId && !doctorId) {
    console.log('Usage: node scripts/test-seo.js [clinic-id] [doctor-id]');
    console.log('\nExample:');
    console.log('  node scripts/test-seo.js 507f1f77bcf86cd799439011');
    console.log('  node scripts/test-seo.js 507f1f77bcf86cd799439011 507f1f77bcf86cd799439012');
    process.exit(1);
  }
  
  testSEO();
}

module.exports = { testSEO };

