/**
 * Indexing Decision Service
 * 
 * Central brain for index/noindex logic
 * 
 * Rules handled:
 * - Profile completeness
 * - Paid vs free
 * - Duplicate detection
 * - Thin content blocking
 */

import dbConnect from '../database';
import Clinic from '../../models/Clinic';
import DoctorProfile from '../../models/DoctorProfile';
import JobPosting from '../../models/JobPosting';
import Treatment from '../../models/Treatment';

export interface IndexingDecision {
  shouldIndex: boolean;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  warnings: string[];
}

/**
 * Check if clinic profile is complete
 */
async function isClinicComplete(clinic: any): Promise<boolean> {
  const requiredFields = ['name', 'address', 'location', 'photos'];
  const hasRequiredFields = requiredFields.every(field => {
    if (field === 'photos') {
      return clinic.photos && clinic.photos.length > 0;
    }
    return clinic[field] && clinic[field] !== '';
  });

  const hasTreatments = clinic.treatments && clinic.treatments.length > 0;
  const hasPricing = clinic.pricing && clinic.pricing !== '';

  return hasRequiredFields && hasTreatments && hasPricing;
}

/**
 * Check if doctor profile is complete
 */
async function isDoctorComplete(doctorProfile: any, user: any): Promise<boolean> {
  const requiredFields = ['degree', 'experience', 'address', 'location'];
  const hasRequiredFields = requiredFields.every(field => {
    return doctorProfile[field] && doctorProfile[field] !== '';
  });

  const hasTreatments = doctorProfile.treatments && doctorProfile.treatments.length > 0;
  const hasResume = doctorProfile.resumeUrl && doctorProfile.resumeUrl !== '';
  const hasUserInfo = user && user.name && user.email;

  return hasRequiredFields && hasTreatments && hasResume && hasUserInfo;
}

/**
 * Check for duplicate content
 */
async function checkDuplicates(entityType: 'clinic' | 'doctor', entityId: string, name: string): Promise<boolean> {
  await dbConnect();

  if (entityType === 'clinic') {
    const duplicates = await Clinic.find({
      _id: { $ne: entityId },
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      isApproved: true,
      slugLocked: true,
    }).limit(1);
    return duplicates.length > 0;
  } else {
    const duplicates = await DoctorProfile.find({
      _id: { $ne: entityId },
    })
      .populate('user', 'name')
      .limit(10);

    const duplicateNames = duplicates.filter((doc: any) => {
      const user = doc.user;
      return user && typeof user === 'object' && 'name' in user && 
             (user as any).name?.toLowerCase() === name.toLowerCase();
    });
    return duplicateNames.length > 0;
  }
}

/**
 * Check for thin content
 */
function hasThinContent(entityType: 'clinic' | 'doctor', entity: any): boolean {
  if (entityType === 'clinic') {
    // Clinic is thin if:
    // - No description/services
    // - Very few treatments
    // - No photos
    const hasMinimalContent = 
      (!entity.servicesName || entity.servicesName.length === 0) &&
      (!entity.treatments || entity.treatments.length < 2) &&
      (!entity.photos || entity.photos.length === 0);
    
    return hasMinimalContent;
  } else {
    // Doctor is thin if:
    // - No treatments
    // - No experience details
    // - No photos
    const hasMinimalContent = 
      (!entity.treatments || entity.treatments.length === 0) &&
      (!entity.experience || entity.experience < 1) &&
      (!entity.photos || entity.photos.length === 0);
    
    return hasMinimalContent;
  }
}

/**
 * Check if job posting is complete
 */
async function isJobComplete(job: any): Promise<boolean> {
  const requiredFields = ['jobTitle', 'companyName', 'location', 'description'];
  const hasRequiredFields = requiredFields.every(field => {
    return job[field] && job[field] !== '';
  });

  const hasDepartment = job.department && job.department !== '';
  const hasJobType = job.jobType && job.jobType !== '';
  const hasSalary = job.salary && job.salary !== '';

  return hasRequiredFields && hasDepartment && hasJobType && hasSalary;
}

/**
 * Decide if entity should be indexed
 */
export async function decideIndexing(
  entityType: 'clinic' | 'doctor' | 'job' | 'blog' | 'treatment',
  entityId: string
): Promise<IndexingDecision> {
  await dbConnect();

  const warnings: string[] = [];
  let shouldIndex = true;
  let reason = '';
  let priority: 'high' | 'medium' | 'low' = 'medium';

  try {
    if (entityType === 'clinic') {
      const clinic = await Clinic.findById(entityId);
      if (!clinic) {
        return {
          shouldIndex: false,
          reason: 'Clinic not found',
          priority: 'low',
          warnings: [],
        };
      }

      // Check approval
      if (!clinic.isApproved) {
        return {
          shouldIndex: false,
          reason: 'Clinic not approved',
          priority: 'low',
          warnings: [],
        };
      }

      // Check slug
      if (!clinic.slug || !clinic.slugLocked) {
        return {
          shouldIndex: false,
          reason: 'Slug not generated or locked',
          priority: 'low',
          warnings: [],
        };
      }

      // Check profile completeness
      const isComplete = await isClinicComplete(clinic);
      if (!isComplete) {
        warnings.push('Profile incomplete - missing required fields');
        priority = 'low';
      }

      // Check for duplicates
      const clinicName = clinic.name || '';
      const hasDuplicates = await checkDuplicates('clinic', entityId, clinicName);
      if (hasDuplicates) {
        warnings.push('Potential duplicate clinic name detected');
        priority = 'low';
      }

      // Check for thin content
      if (hasThinContent('clinic', clinic)) {
        warnings.push('Thin content detected - consider adding more details');
        priority = 'low';
      }

      // Determine indexing decision
      if (!isComplete) {
        shouldIndex = false;
        reason = 'Incomplete profile';
      } else if (hasDuplicates && hasThinContent('clinic', clinic)) {
        shouldIndex = false;
        reason = 'Duplicate and thin content';
      } else {
        shouldIndex = true;
        reason = 'Profile complete and unique';
        priority = 'high';
      }

    } else if (entityType === 'doctor') {
      const doctorProfile = await DoctorProfile.findById(entityId).populate('user');
      if (!doctorProfile) {
        return {
          shouldIndex: false,
          reason: 'Doctor profile not found',
          priority: 'low',
          warnings: [],
        };
      }

      const user = doctorProfile.user as any;

      // Check approval
      if (!user?.isApproved) {
        return {
          shouldIndex: false,
          reason: 'Doctor not approved',
          priority: 'low',
          warnings: [],
        };
      }

      // Check slug
      if (!doctorProfile.slug || !doctorProfile.slugLocked) {
        return {
          shouldIndex: false,
          reason: 'Slug not generated or locked',
          priority: 'low',
          warnings: [],
        };
      }

      // Check profile completeness
      const isComplete = await isDoctorComplete(doctorProfile, user);
      if (!isComplete) {
        warnings.push('Profile incomplete - missing required fields');
        priority = 'low';
      }

      // Check for duplicates
      const hasDuplicates = await checkDuplicates('doctor', entityId, user?.name || '');
      if (hasDuplicates) {
        warnings.push('Potential duplicate doctor name detected');
        priority = 'low';
      }

      // Check for thin content
      if (hasThinContent('doctor', doctorProfile)) {
        warnings.push('Thin content detected - consider adding more details');
        priority = 'low';
      }

      // Determine indexing decision
      if (!isComplete) {
        shouldIndex = false;
        reason = 'Incomplete profile';
      } else if (hasDuplicates && hasThinContent('doctor', doctorProfile)) {
        shouldIndex = false;
        reason = 'Duplicate and thin content';
      } else {
        shouldIndex = true;
        reason = 'Profile complete and unique';
        priority = 'high';
      }
    } else if (entityType === 'job') {
      const job = await JobPosting.findById(entityId);
      if (!job) {
        return {
          shouldIndex: false,
          reason: 'Job not found',
          priority: 'low',
          warnings: [],
        };
      }

      // Check approval
      if (job.status !== 'approved') {
        return {
          shouldIndex: false,
          reason: 'Job not approved',
          priority: 'low',
          warnings: [],
        };
      }

      // Check slug
      if (!job.slug || !job.slugLocked) {
        return {
          shouldIndex: false,
          reason: 'Slug not generated or locked',
          priority: 'low',
          warnings: [],
        };
      }

      // Check profile completeness
      const isComplete = await isJobComplete(job);
      if (!isComplete) {
        warnings.push('Job posting incomplete - missing required fields');
        priority = 'low';
      }

      // Check for duplicates (same job title and company)
      const duplicateJobs = await JobPosting.find({
        _id: { $ne: entityId },
        jobTitle: { $regex: new RegExp(`^${job.jobTitle}$`, 'i') },
        companyName: { $regex: new RegExp(`^${job.companyName}$`, 'i') },
        status: 'approved',
        slugLocked: true,
      }).limit(1);
      
      if (duplicateJobs.length > 0) {
        warnings.push('Potential duplicate job posting detected');
        priority = 'low';
      }

      // Check for thin content
      if (!job.description || job.description.length < 50) {
        warnings.push('Thin content detected - consider adding more job details');
        priority = 'low';
      }

      // Determine indexing decision
      if (!isComplete) {
        shouldIndex = false;
        reason = 'Incomplete job posting';
      } else if (duplicateJobs.length > 0 && (!job.description || job.description.length < 50)) {
        shouldIndex = false;
        reason = 'Duplicate and thin content';
      } else {
        shouldIndex = true;
        reason = 'Job posting complete and unique';
        priority = 'high';
      }
    } else if (entityType === 'blog') {
      const Blog = (await import('../../models/Blog')).default;
      const blog = await Blog.findById(entityId);
      if (!blog) {
        return {
          shouldIndex: false,
          reason: 'Blog not found',
          priority: 'low',
          warnings: [],
        };
      }

      // Check if published
      if (blog.status !== 'published') {
        return {
          shouldIndex: false,
          reason: 'Blog not published',
          priority: 'low',
          warnings: [],
        };
      }

      // Check slug
      if (!blog.paramlink || !blog.slugLocked) {
        return {
          shouldIndex: false,
          reason: 'Slug not generated or locked',
          priority: 'low',
          warnings: [],
        };
      }

      // Check content completeness
      const hasContent = blog.content && blog.content.length > 100;
      const hasTitle = blog.title && blog.title.length > 10;

      if (!hasContent || !hasTitle) {
        return {
          shouldIndex: false,
          reason: 'Blog content too thin',
          priority: 'low',
          warnings: [],
        };
      }

      // Blog is complete and published - index it
      shouldIndex = true;
      reason = 'Blog published and complete';
      priority = 'high';
    } else if (entityType === 'treatment') {
      const treatment = await Treatment.findById(entityId);
      if (!treatment) {
        return {
          shouldIndex: false,
          reason: 'Treatment not found',
          priority: 'low',
          warnings: [],
        };
      }

      // Check slug
      if (!treatment.slug) {
        return {
          shouldIndex: false,
          reason: 'Slug not generated',
          priority: 'low',
          warnings: [],
        };
      }

      // Check if treatment has name
      if (!treatment.name || !treatment.name.trim()) {
        return {
          shouldIndex: false,
          reason: 'Treatment name missing',
          priority: 'low',
          warnings: [],
        };
      }

      // Treatment is complete - index it
      shouldIndex = true;
      reason = 'Treatment complete with slug';
      priority = 'high';
      
      // Warn if no subcategories
      if (!treatment.subcategories || treatment.subcategories.length === 0) {
        warnings.push('Treatment has no subcategories');
        priority = 'medium';
      }
    }

    return {
      shouldIndex,
      reason,
      priority,
      warnings,
    };
  } catch (error: any) {
    console.error('Error in indexing decision:', error);
    return {
      shouldIndex: false,
      reason: `Error: ${error.message}`,
      priority: 'low',
      warnings: [],
    };
  }
}

/**
 * Get indexing status for an entity
 */
export async function getIndexingStatus(
  entityType: 'clinic' | 'doctor' | 'job',
  entityId: string
): Promise<IndexingDecision> {
  return await decideIndexing(entityType, entityId);
}

