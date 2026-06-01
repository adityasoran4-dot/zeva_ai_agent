/**
 * Sitemap Generator Service
 * 
 * Purpose: Auto-update sitemaps
 * 
 * Features:
 * - Includes only indexable pages
 * - Auto-refresh daily
 */

import fs from 'fs';
import path from 'path';
import dbConnect from '../database';
import Clinic from '../../models/Clinic';
import DoctorProfile from '../../models/DoctorProfile';
import JobPosting from '../../models/JobPosting';
import Blog from '../../models/Blog';
import { decideIndexing } from './IndexingService';
import { getCanonicalUrl } from './CanonicalService';

const SITEMAP_DIR = path.join(process.cwd(), 'public');
const CLINICS_SITEMAP = path.join(SITEMAP_DIR, 'sitemap-clinics.xml');
const DOCTORS_SITEMAP = path.join(SITEMAP_DIR, 'sitemap-doctors.xml');
const JOBS_SITEMAP = path.join(SITEMAP_DIR, 'sitemap-jobs.xml');
const BLOGS_SITEMAP = path.join(SITEMAP_DIR, 'sitemap-blogs.xml');
const MAIN_SITEMAP = path.join(SITEMAP_DIR, 'sitemap.xml');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://zeva360.com';

/**
 * Generate XML sitemap entry
 */
function generateSitemapEntry(url: string, lastmod?: string, changefreq: string = 'weekly', priority: string = '0.8'): string {
  const lastmodDate = lastmod || new Date().toISOString();
  return `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmodDate}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

/**
 * Generate clinics sitemap
 */
export async function generateClinicsSitemap(): Promise<string> {
  await dbConnect();

  const clinics = await Clinic.find({
    isApproved: true,
    slugLocked: true,
    slug: { $exists: true, $ne: null },
  });

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  for (const clinic of clinics) {
    // Check if should be indexed
    const decision = await decideIndexing('clinic', clinic._id.toString());
    
    if (decision.shouldIndex) {
      const canonicalUrl = getCanonicalUrl('clinic', clinic, BASE_URL);
      const lastmod = clinic.updatedAt?.toISOString();
      const priority = decision.priority === 'high' ? '0.9' : decision.priority === 'medium' ? '0.7' : '0.5';
      
      xml += generateSitemapEntry(canonicalUrl, lastmod, 'weekly', priority);
    }
  }

  xml += `</urlset>`;

  return xml;
}

/**
 * Generate doctors sitemap
 */
export async function generateDoctorsSitemap(): Promise<string> {
  await dbConnect();

  const doctors = await DoctorProfile.find({
    slugLocked: true,
    slug: { $exists: true, $ne: null },
  }).populate('user');

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  for (const doctor of doctors) {
    const user = doctor.user as any;
    
    // Check if should be indexed
    if (user?.isApproved) {
      const decision = await decideIndexing('doctor', doctor._id.toString());
      
      if (decision.shouldIndex) {
        const canonicalUrl = getCanonicalUrl('doctor', doctor, BASE_URL);
        const lastmod = doctor.updatedAt?.toISOString();
        const priority = decision.priority === 'high' ? '0.9' : decision.priority === 'medium' ? '0.7' : '0.5';
        
        xml += generateSitemapEntry(canonicalUrl, lastmod, 'weekly', priority);
      }
    }
  }

  xml += `</urlset>`;

  return xml;
}

/**
 * Generate jobs sitemap
 */
export async function generateJobsSitemap(): Promise<string> {
  await dbConnect();

  const jobs = await JobPosting.find({
    status: 'approved',
    slugLocked: true,
    slug: { $exists: true, $ne: null },
  });

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  for (const job of jobs) {
    // Check if should be indexed
    const decision = await decideIndexing('job', job._id.toString());
    
    if (decision.shouldIndex) {
      const canonicalUrl = getCanonicalUrl('job', job, BASE_URL);
      const lastmod = job.updatedAt?.toISOString();
      const priority = decision.priority === 'high' ? '0.9' : decision.priority === 'medium' ? '0.7' : '0.5';
      
      xml += generateSitemapEntry(canonicalUrl, lastmod, 'weekly', priority);
    }
  }

  xml += `</urlset>`;

  return xml;
}

/**
 * Generate blogs sitemap
 */
export async function generateBlogsSitemap(): Promise<string> {
  await dbConnect();

  const blogs = await Blog.find({
    status: 'published',
    slugLocked: true,
    paramlink: { $exists: true, $ne: null },
  });

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  for (const blog of blogs) {
    // Check if should be indexed
    const decision = await decideIndexing('blog', blog._id.toString());
    
    if (decision.shouldIndex) {
      const canonicalUrl = getCanonicalUrl('blog', blog, BASE_URL);
      const lastmod = blog.updatedAt?.toISOString();
      const priority = decision.priority === 'high' ? '0.9' : decision.priority === 'medium' ? '0.7' : '0.5';
      
      xml += generateSitemapEntry(canonicalUrl, lastmod, 'weekly', priority);
    }
  }

  xml += `</urlset>`;

  return xml;
}

/**
 * Generate main sitemap index
 */
export async function generateMainSitemap(): Promise<string> {
  const lastmod = new Date().toISOString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE_URL}/sitemap-clinics.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-doctors.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-jobs.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-blogs.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
</sitemapindex>`;
}

/**
 * Update all sitemaps
 */
export async function updateSitemaps(): Promise<{ success: boolean; files: string[]; error?: string }> {
  try {
    // Ensure directory exists
    if (!fs.existsSync(SITEMAP_DIR)) {
      fs.mkdirSync(SITEMAP_DIR, { recursive: true });
    }

    // Generate sitemaps
    const clinicsSitemap = await generateClinicsSitemap();
    const doctorsSitemap = await generateDoctorsSitemap();
    const jobsSitemap = await generateJobsSitemap();
    const blogsSitemap = await generateBlogsSitemap();
    const mainSitemap = await generateMainSitemap();

    // Write files
    fs.writeFileSync(CLINICS_SITEMAP, clinicsSitemap, 'utf8');
    fs.writeFileSync(DOCTORS_SITEMAP, doctorsSitemap, 'utf8');
    fs.writeFileSync(JOBS_SITEMAP, jobsSitemap, 'utf8');
    fs.writeFileSync(BLOGS_SITEMAP, blogsSitemap, 'utf8');
    fs.writeFileSync(MAIN_SITEMAP, mainSitemap, 'utf8');

    console.log('✅ Sitemaps updated successfully');

    return {
      success: true,
      files: [
        'sitemap-clinics.xml',
        'sitemap-doctors.xml',
        'sitemap-jobs.xml',
        'sitemap-blogs.xml',
        'sitemap.xml',
      ],
    };
  } catch (error: any) {
    console.error('❌ Error updating sitemaps:', error);
    return {
      success: false,
      files: [],
      error: error.message,
    };
  }
}

/**
 * Update sitemap for specific entity
 */
export async function updateEntitySitemap(
  entityType: 'clinic' | 'doctor' | 'job' | 'blog' | 'treatment'
): Promise<void> {
  try {
    // Ensure directory exists
    if (!fs.existsSync(SITEMAP_DIR)) {
      fs.mkdirSync(SITEMAP_DIR, { recursive: true });
    }

    if (entityType === 'clinic') {
      const clinicsSitemap = await generateClinicsSitemap();
      fs.writeFileSync(CLINICS_SITEMAP, clinicsSitemap, 'utf8');
      console.log('✅ Clinics sitemap updated');
    } else if (entityType === 'doctor') {
      const doctorsSitemap = await generateDoctorsSitemap();
      fs.writeFileSync(DOCTORS_SITEMAP, doctorsSitemap, 'utf8');
      console.log('✅ Doctors sitemap updated');
    } else if (entityType === 'job') {
      const jobsSitemap = await generateJobsSitemap();
      fs.writeFileSync(JOBS_SITEMAP, jobsSitemap, 'utf8');
      console.log('✅ Jobs sitemap updated');
    } else if (entityType === 'blog') {
      const blogsSitemap = await generateBlogsSitemap();
      fs.writeFileSync(BLOGS_SITEMAP, blogsSitemap, 'utf8');
      console.log('✅ Blogs sitemap updated');
    }

    // Always update main sitemap index
    const mainSitemap = await generateMainSitemap();
    fs.writeFileSync(MAIN_SITEMAP, mainSitemap, 'utf8');
    console.log('✅ Main sitemap index updated');
  } catch (error: any) {
    console.error(`❌ Error updating ${entityType} sitemap:`, error);
    throw error;
  }
}

