/**
 * Canonical Resolver Service
 * 
 * Purpose: Kill duplicate URLs
 * 
 * Ensures canonical URLs point to slug-based URLs
 */

import { getEntityRoute } from '../slugService';

/**
 * Get canonical URL for clinic
 */
export function getClinicCanonical(clinic: any, baseUrl: string = ''): string {
  if (!clinic) {
    return '';
  }

  // If slug exists and is locked, use slug-based URL
  if (clinic.slug && clinic.slugLocked) {
    const slugRoute = getEntityRoute('clinic', clinic.slug);
    return baseUrl ? `${baseUrl}${slugRoute}` : slugRoute;
  }

  // Fallback to ObjectId (should rarely happen)
  return baseUrl ? `${baseUrl}/clinics/${clinic._id}` : `/clinics/${clinic._id}`;
}

/**
 * Get canonical URL for doctor
 */
export function getDoctorCanonical(doctorProfile: any, baseUrl: string = ''): string {
  if (!doctorProfile) {
    return '';
  }

  // If slug exists and is locked, use slug-based URL
  if (doctorProfile.slug && doctorProfile.slugLocked) {
    const slugRoute = getEntityRoute('doctor', doctorProfile.slug);
    return baseUrl ? `${baseUrl}${slugRoute}` : slugRoute;
  }

  // Fallback to ObjectId (should rarely happen)
  return baseUrl ? `${baseUrl}/doctor/${doctorProfile._id}` : `/doctor/${doctorProfile._id}`;
}

/**
 * Get canonical URL for job
 */
export function getJobCanonical(job: any, baseUrl: string = ''): string {
  if (!job) {
    return '';
  }

  // If slug exists and is locked, use slug-based URL
  if (job.slug && job.slugLocked) {
    const slugRoute = getEntityRoute('job', job.slug);
    return baseUrl ? `${baseUrl}${slugRoute}` : slugRoute;
  }

  // Fallback to ObjectId (should rarely happen)
  return baseUrl ? `${baseUrl}/job-details/${job._id}` : `/job-details/${job._id}`;
}

/**
 * Get canonical URL for entity
 */
export function getBlogCanonical(blog: any, baseUrl: string = ''): string {
  if (!blog || !blog.paramlink) {
    return '';
  }
  const slug = blog.paramlink;
  return `${baseUrl}/blogs/${slug}`;
}

export function getTreatmentCanonical(treatment: any, baseUrl: string = ''): string {
  if (!treatment || !treatment.slug) {
    return '';
  }
  const slugRoute = getEntityRoute('treatment', treatment.slug);
  return baseUrl ? `${baseUrl}${slugRoute}` : slugRoute;
}

export function getCanonicalUrl(
  entityType: 'clinic' | 'doctor' | 'job' | 'blog' | 'treatment',
  entity: any,
  baseUrl?: string
): string {
  const defaultBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://zeva360.com';
  const url = baseUrl || defaultBaseUrl;

  if (entityType === 'clinic') {
    return getClinicCanonical(entity, url);
  } else if (entityType === 'doctor') {
    return getDoctorCanonical(entity, url);
  } else if (entityType === 'job') {
    return getJobCanonical(entity, url);
  } else if (entityType === 'blog') {
    return getBlogCanonical(entity, url);
  } else {
    return getTreatmentCanonical(entity, url);
  }
}

/**
 * Check if URL is canonical
 */
export function isCanonicalUrl(
  entityType: 'clinic' | 'doctor' | 'job' | 'blog' | 'treatment',
  entity: any,
  currentUrl: string
): boolean {
  const canonicalUrl = getCanonicalUrl(entityType, entity);
  return currentUrl === canonicalUrl || currentUrl.endsWith(canonicalUrl);
}

/**
 * Resolve canonical URL (redirect if needed)
 */
export function resolveCanonical(
  entityType: 'clinic' | 'doctor' | 'job' | 'blog' | 'treatment',
  entity: any,
  currentUrl: string
): { isCanonical: boolean; canonicalUrl: string; shouldRedirect: boolean } {
  const canonicalUrl = getCanonicalUrl(entityType, entity);
  const isCanonical = isCanonicalUrl(entityType, entity, currentUrl);
  
  return {
    isCanonical,
    canonicalUrl,
    shouldRedirect: !isCanonical && entity.slug && (entity.slugLocked || entityType === 'treatment'),
  };
}

