/**
 * Meta Tag Generator Service
 * 
 * Purpose: Dynamic, SEO-optimized titles/descriptions
 * 
 * Features:
 * - Template-driven
 * - Keyword-safe
 * - No over-optimization
 */

import { IndexingDecision } from './IndexingService';

export interface MetaTags {
  title: string;
  description: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

/**
 * Generate meta tags for clinic
 */
export async function generateClinicMeta(
  clinic: any,
  _decision: IndexingDecision
): Promise<MetaTags> {
  const clinicName = clinic.name || 'Clinic';
  const location = clinic.address || '';
  const treatments = clinic.treatments?.map((t: any) => t.mainTreatment).join(', ') || '';
  
  // Generate title (max 60 chars for SEO)
  let title = `${clinicName}`;
  if (location) {
    const locationPart = location.split(',')[0]; // Get city/area
    title = `${clinicName} in ${locationPart}`;
  }
  
  // Truncate if too long
  if (title.length > 60) {
    title = title.substring(0, 57) + '...';
  }

  // Generate description (max 160 chars for SEO)
  let description = `${clinicName}`;
  if (treatments) {
    description += ` offers ${treatments}`;
  }
  if (location) {
    description += ` in ${location}`;
  }
  description += '. Book appointment online with verified healthcare providers.';

  // Truncate if too long
  if (description.length > 160) {
    description = description.substring(0, 157) + '...';
  }

  // Generate keywords
  const keywords: string[] = [];
  if (clinicName) keywords.push(clinicName.toLowerCase());
  if (location) {
    const locationParts = location.split(',').map((p: string) => p.trim());
    keywords.push(...locationParts.map((p: string) => p.toLowerCase()));
  }
  if (treatments) {
    const treatmentKeywords = treatments.split(',').map((t: string) => t.trim().toLowerCase());
    keywords.push(...treatmentKeywords);
  }
  keywords.push('healthcare', 'clinic', 'appointment', 'verified');

  return {
    title,
    description,
    keywords: [...new Set(keywords)], // Remove duplicates
    ogTitle: title,
    ogDescription: description,
    ogImage: clinic.photos?.[0] || undefined,
  };
}

/**
 * Generate meta tags for doctor
 */
export async function generateDoctorMeta(
  doctorProfile: any,
  user: any,
  _decision: IndexingDecision
): Promise<MetaTags> {
  const doctorName = user?.name || 'Doctor';
  const degree = doctorProfile.degree || '';
  const location = doctorProfile.address || '';
  const specialization = doctorProfile.treatments?.[0]?.mainTreatment || '';
  
  // Generate title (max 60 chars for SEO)
  let title = `Dr. ${doctorName}`;
  if (degree) {
    title += ` - ${degree}`;
  }
  if (location) {
    const locationPart = location.split(',')[0];
    title += ` in ${locationPart}`;
  }
  
  // Truncate if too long
  if (title.length > 60) {
    title = title.substring(0, 57) + '...';
  }

  // Generate description (max 160 chars for SEO)
  let description = `Dr. ${doctorName}`;
  if (degree) {
    description += ` (${degree})`;
  }
  if (specialization) {
    description += ` specializes in ${specialization}`;
  }
  if (location) {
    description += ` in ${location}`;
  }
  if (doctorProfile.experience) {
    description += ` with ${doctorProfile.experience} years of experience`;
  }
  description += '. Book appointment online.';

  // Truncate if too long
  if (description.length > 160) {
    description = description.substring(0, 157) + '...';
  }

  // Generate keywords
  const keywords: string[] = [];
  if (doctorName) keywords.push(doctorName.toLowerCase());
  if (degree) keywords.push(degree.toLowerCase());
  if (location) {
    const locationParts = location.split(',').map((p: string) => p.trim());
    keywords.push(...locationParts.map((p: string) => p.toLowerCase()));
  }
  if (specialization) keywords.push(specialization.toLowerCase());
  keywords.push('doctor', 'physician', 'appointment', 'healthcare');

  return {
    title,
    description,
    keywords: [...new Set(keywords)], // Remove duplicates
    ogTitle: title,
    ogDescription: description,
    ogImage: doctorProfile.photos?.[0] || undefined,
  };
}

/**
 * Generate meta tags for job
 */
export async function generateJobMeta(
  job: any,
  _decision: IndexingDecision
): Promise<MetaTags> {
  const jobTitle = job.jobTitle || 'Job';
  const companyName = job.companyName || '';
  const location = job.location || '';
  const department = job.department || '';
  const jobType = job.jobType || '';
  
  // Generate title (max 60 chars for SEO)
  let title = `${jobTitle}`;
  if (companyName) {
    title += ` at ${companyName}`;
  }
  if (location) {
    const locationPart = location.split(',')[0];
    title += ` in ${locationPart}`;
  }
  
  // Truncate if too long
  if (title.length > 60) {
    title = title.substring(0, 57) + '...';
  }

  // Generate description (max 160 chars for SEO)
  let description = `${jobTitle}`;
  if (companyName) {
    description += ` at ${companyName}`;
  }
  if (department) {
    description += ` - ${department}`;
  }
  if (location) {
    description += ` in ${location}`;
  }
  if (jobType) {
    description += ` (${jobType})`;
  }
  if (job.salary) {
    description += `. Salary: ${job.salary}`;
  }
  description += '. Apply now!';

  // Truncate if too long
  if (description.length > 160) {
    description = description.substring(0, 157) + '...';
  }

  // Generate keywords
  const keywords: string[] = [];
  if (jobTitle) keywords.push(jobTitle.toLowerCase());
  if (companyName) keywords.push(companyName.toLowerCase());
  if (location) {
    const locationParts = location.split(',').map((p: string) => p.trim());
    keywords.push(...locationParts.map((p: string) => p.toLowerCase()));
  }
  if (department) keywords.push(department.toLowerCase());
  if (jobType) keywords.push(jobType.toLowerCase());
  keywords.push('job', 'career', 'hiring', 'employment', 'opportunity');

  return {
    title,
    description,
    keywords: [...new Set(keywords)], // Remove duplicates
    ogTitle: title,
    ogDescription: description,
  };
}

/**
 * Generate meta tags for entity
 */
export async function generateBlogMeta(
  blog: any,
  _decision: IndexingDecision
): Promise<MetaTags> {
  const title = blog.title || 'Blog Post';
  const content = blog.content || '';
  
  // Strip HTML and get first 160 chars for description
  const plainText = content.replace(/<[^>]*>/g, '').trim();
  const description = plainText.length > 160 
    ? plainText.substring(0, 157) + '...'
    : plainText || 'Read this blog post';

  // Extract keywords from title and content
  const titleWords = title.toLowerCase().match(/\b\w+\b/g) || [];
  const contentWords = plainText.toLowerCase().match(/\b\w{4,}\b/g) || [];
  const keywords = [...new Set([...titleWords, ...contentWords.slice(0, 5)])].slice(0, 10);

  return {
    title: title.length > 60 ? title.substring(0, 57) + '...' : title,
    description: description.length > 160 ? description.substring(0, 157) + '...' : description,
    keywords,
    ogTitle: title,
    ogDescription: description,
    ogImage: blog.image || '',
  };
}

export async function generateMeta(
  entityType: 'clinic' | 'doctor' | 'job' | 'blog' | 'treatment',
  entity: any,
  decision: IndexingDecision
): Promise<MetaTags> {
  if (entityType === 'clinic') {
    return await generateClinicMeta(entity, decision);
  } else if (entityType === 'doctor') {
    const user = entity.user || {};
    return await generateDoctorMeta(entity, user, decision);
  } else if (entityType === 'job') {
    return await generateJobMeta(entity, decision);
  } else if (entityType === 'blog') {
    return await generateBlogMeta(entity, decision);
  } else {
    // Treatment meta tags
    const subTreatments = entity.subcategories || [];
    const subTreatmentNames = subTreatments.map((sub: any) => sub.name).join(', ');
    const keywords = [entity.name];
    if (subTreatmentNames) {
      keywords.push(...subTreatments.map((sub: any) => sub.name));
    }
    
    return {
      title: `${entity.name}${subTreatments.length > 0 ? ` - ${subTreatments.length} Sub-treatments` : ''} | Zeva360`,
      description: `Find ${entity.name}${subTreatments.length > 0 ? ` and related sub-treatments like ${subTreatmentNames}` : ''} at Zeva360.`,
      keywords: keywords.slice(0, 10),
    };
  }
}

