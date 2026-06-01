/**
 * Duplicate Content Detector Service
 * 
 * Purpose: Prevent SEO dilution
 * 
 * Checks:
 * - Similar content
 * - Same clinic multiple URLs
 * - Area/city duplication
 */

import dbConnect from '../database';
import Clinic from '../../models/Clinic';
import DoctorProfile from '../../models/DoctorProfile';
import JobPosting from '../../models/JobPosting';
import Treatment from '../../models/Treatment';

export interface DuplicateCheck {
  isDuplicate: boolean;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  similarEntities: Array<{
    id: string;
    name: string;
    slug?: string;
    similarity: number;
  }>;
}

/**
 * Calculate similarity between two strings (Levenshtein distance)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) {
    return 1.0;
  }

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Levenshtein distance algorithm
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Check for duplicate clinics
 */
export async function checkClinicDuplicates(clinic: any): Promise<DuplicateCheck> {
  await dbConnect();

  const similarEntities: Array<{
    id: string;
    name: string;
    slug?: string;
    similarity: number;
  }> = [];

  // Check by name similarity
  const allClinics = await Clinic.find({
    _id: { $ne: clinic._id },
    isApproved: true,
  });

  for (const otherClinic of allClinics) {
    const nameSimilarity = calculateSimilarity(
      clinic.name?.toLowerCase() || '',
      otherClinic.name?.toLowerCase() || ''
    );

    // Check location similarity
    const addressSimilarity = calculateSimilarity(
      clinic.address?.toLowerCase() || '',
      otherClinic.address?.toLowerCase() || ''
    );

    // Combined similarity score
    const combinedSimilarity = (nameSimilarity * 0.7) + (addressSimilarity * 0.3);

    if (combinedSimilarity > 0.8) {
      similarEntities.push({
        id: otherClinic._id.toString(),
        name: otherClinic.name || '',
        slug: otherClinic.slug || undefined,
        similarity: combinedSimilarity,
      });
    }
  }

  // Check for exact name matches in same area
  const exactNameMatches = await Clinic.find({
    _id: { $ne: clinic._id },
    name: { $regex: new RegExp(`^${clinic.name}$`, 'i') },
    isApproved: true,
  });

  const isDuplicate = similarEntities.length > 0 || exactNameMatches.length > 0;
  let confidence: 'high' | 'medium' | 'low' = 'low';
  let reason = '';

  if (exactNameMatches.length > 0) {
    confidence = 'high';
    reason = `Exact name match found: ${exactNameMatches.length} clinic(s) with same name`;
  } else if (similarEntities.length > 0) {
    const highestSimilarity = Math.max(...similarEntities.map(e => e.similarity));
    if (highestSimilarity > 0.9) {
      confidence = 'high';
    } else if (highestSimilarity > 0.85) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }
    reason = `Similar clinics found: ${similarEntities.length} clinic(s) with ${(highestSimilarity * 100).toFixed(0)}% similarity`;
  } else {
    reason = 'No duplicates detected';
  }

  return {
    isDuplicate,
    confidence,
    reason,
    similarEntities: similarEntities.slice(0, 5), // Limit to top 5
  };
}

/**
 * Check for duplicate doctors
 */
export async function checkDoctorDuplicates(doctorProfile: any, user: any): Promise<DuplicateCheck> {
  await dbConnect();

  const similarEntities: Array<{
    id: string;
    name: string;
    slug?: string;
    similarity: number;
  }> = [];

  const doctorName = user?.name || '';

  // Check by name similarity
  const allDoctors = await DoctorProfile.find({
    _id: { $ne: doctorProfile._id },
  }).populate('user', 'name');

  for (const otherDoctor of allDoctors) {
    const otherUser = otherDoctor.user as any;
    const otherName = otherUser?.name || '';

    if (!otherName) continue;

    const nameSimilarity = calculateSimilarity(
      doctorName.toLowerCase(),
      otherName.toLowerCase()
    );

    // Check address similarity
    const addressSimilarity = calculateSimilarity(
      doctorProfile.address?.toLowerCase() || '',
      otherDoctor.address?.toLowerCase() || ''
    );

    // Check degree similarity
    const degreeSimilarity = calculateSimilarity(
      doctorProfile.degree?.toLowerCase() || '',
      otherDoctor.degree?.toLowerCase() || ''
    );

    // Combined similarity score
    const combinedSimilarity = (nameSimilarity * 0.6) + (addressSimilarity * 0.2) + (degreeSimilarity * 0.2);

    if (combinedSimilarity > 0.85) {
      similarEntities.push({
        id: otherDoctor._id.toString(),
        name: otherName,
        slug: otherDoctor.slug || undefined,
        similarity: combinedSimilarity,
      });
    }
  }

  // Check for exact name matches
  const exactNameMatches = await DoctorProfile.find({
    _id: { $ne: doctorProfile._id },
  })
    .populate('user', 'name')
    .then(doctors => doctors.filter(doc => {
      const docUser = doc.user as any;
      return docUser?.name?.toLowerCase() === doctorName.toLowerCase();
    }));

  const isDuplicate = similarEntities.length > 0 || exactNameMatches.length > 0;
  let confidence: 'high' | 'medium' | 'low' = 'low';
  let reason = '';

  if (exactNameMatches.length > 0) {
    confidence = 'high';
    reason = `Exact name match found: ${exactNameMatches.length} doctor(s) with same name`;
  } else if (similarEntities.length > 0) {
    const highestSimilarity = Math.max(...similarEntities.map(e => e.similarity));
    if (highestSimilarity > 0.9) {
      confidence = 'high';
    } else if (highestSimilarity > 0.87) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }
    reason = `Similar doctors found: ${similarEntities.length} doctor(s) with ${(highestSimilarity * 100).toFixed(0)}% similarity`;
  } else {
    reason = 'No duplicates detected';
  }

  return {
    isDuplicate,
    confidence,
    reason,
    similarEntities: similarEntities.slice(0, 5), // Limit to top 5
  };
}

/**
 * Check for duplicate jobs
 */
export async function checkJobDuplicates(job: any): Promise<DuplicateCheck> {
  await dbConnect();

  const similarEntities: Array<{
    id: string;
    name: string;
    slug?: string;
    similarity: number;
  }> = [];

  // Check by job title and company similarity
  const allJobs = await JobPosting.find({
    _id: { $ne: job._id },
    status: 'approved',
  });

  for (const otherJob of allJobs) {
    const titleSimilarity = calculateSimilarity(
      job.jobTitle?.toLowerCase() || '',
      otherJob.jobTitle?.toLowerCase() || ''
    );

    const companySimilarity = calculateSimilarity(
      job.companyName?.toLowerCase() || '',
      otherJob.companyName?.toLowerCase() || ''
    );

    const combinedSimilarity = (titleSimilarity * 0.6) + (companySimilarity * 0.4);

    if (combinedSimilarity > 0.85) {
      similarEntities.push({
        id: otherJob._id.toString(),
        name: `${otherJob.jobTitle} at ${otherJob.companyName}`,
        slug: otherJob.slug || undefined,
        similarity: combinedSimilarity,
      });
    }
  }

  // Check for exact matches
  const exactMatches = await JobPosting.find({
    _id: { $ne: job._id },
    jobTitle: { $regex: new RegExp(`^${job.jobTitle}$`, 'i') },
    companyName: { $regex: new RegExp(`^${job.companyName}$`, 'i') },
    status: 'approved',
  });

  const isDuplicate = similarEntities.length > 0 || exactMatches.length > 0;
  let confidence: 'high' | 'medium' | 'low' = 'low';
  let reason = '';

  if (exactMatches.length > 0) {
    confidence = 'high';
    reason = `Exact match found: ${exactMatches.length} job(s) with same title and company`;
  } else if (similarEntities.length > 0) {
    const highestSimilarity = Math.max(...similarEntities.map(e => e.similarity));
    if (highestSimilarity > 0.9) {
      confidence = 'high';
    } else if (highestSimilarity > 0.87) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }
    reason = `Similar jobs found: ${similarEntities.length} job(s) with ${(highestSimilarity * 100).toFixed(0)}% similarity`;
  } else {
    reason = 'No duplicates detected';
  }

  return {
    isDuplicate,
    confidence,
    reason,
    similarEntities: similarEntities.slice(0, 5),
  };
}

/**
 * Check for duplicates
 */
export async function checkBlogDuplicates(blog: any): Promise<DuplicateCheck> {
  await dbConnect();
  const Blog = (await import('../../models/Blog')).default;
  
  const blogTitle = blog.title || '';
  const blogContent = blog.content || '';
  
  // Find other published blogs with similar titles
  const otherBlogs = await Blog.find({
    _id: { $ne: blog._id },
    status: 'published',
  }).select('title content paramlink');

  const similarEntities: Array<{
    id: string;
    name: string;
    slug?: string;
    similarity: number;
  }> = [];

  for (const otherBlog of otherBlogs) {
    const titleSimilarity = calculateSimilarity(
      blogTitle.toLowerCase(),
      (otherBlog.title || '').toLowerCase()
    );

    // Check content similarity (first 500 chars)
    const content1 = blogContent.substring(0, 500).toLowerCase();
    const content2 = (otherBlog.content || '').substring(0, 500).toLowerCase();
    const contentSimilarity = calculateSimilarity(content1, content2);

    const combinedSimilarity = (titleSimilarity * 0.6 + contentSimilarity * 0.4);

    if (combinedSimilarity > 0.85) {
      similarEntities.push({
        id: otherBlog._id.toString(),
        name: otherBlog.title || 'Untitled',
        slug: otherBlog.paramlink || undefined,
        similarity: combinedSimilarity,
      });
    }
  }

  const isDuplicate = similarEntities.length > 0;
  let confidence: 'high' | 'medium' | 'low' = 'low';
  let reason = '';

  if (similarEntities.length > 0) {
    const highestSimilarity = Math.max(...similarEntities.map(e => e.similarity));
    if (highestSimilarity > 0.9) {
      confidence = 'high';
    } else if (highestSimilarity > 0.87) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }
    reason = `Similar blogs found: ${similarEntities.length} blog(s) with ${(highestSimilarity * 100).toFixed(0)}% similarity`;
  } else {
    reason = 'No duplicates detected';
  }

  return {
    isDuplicate,
    confidence,
    reason,
    similarEntities: similarEntities.slice(0, 5),
  };
}

/**
 * Check for duplicate treatments
 */
export async function checkTreatmentDuplicates(treatment: any): Promise<DuplicateCheck> {
  await dbConnect();

  const similarEntities: Array<{
    id: string;
    name: string;
    slug?: string;
    similarity: number;
  }> = [];

  // Check by name similarity
  const allTreatments = await Treatment.find({
    _id: { $ne: treatment._id },
  });

  for (const otherTreatment of allTreatments) {
    const nameSimilarity = calculateSimilarity(
      treatment.name?.toLowerCase() || '',
      otherTreatment.name?.toLowerCase() || ''
    );

    if (nameSimilarity > 0.8) {
      similarEntities.push({
        id: otherTreatment._id.toString(),
        name: otherTreatment.name,
        slug: otherTreatment.slug || undefined,
        similarity: nameSimilarity,
      });
    }
  }

  // Check for exact name matches
  const exactNameMatches = await Treatment.find({
    _id: { $ne: treatment._id },
    name: { $regex: new RegExp(`^${treatment.name}$`, 'i') },
  });

  const isDuplicate = similarEntities.length > 0 || exactNameMatches.length > 0;
  let confidence: 'high' | 'medium' | 'low' = 'low';
  let reason = '';

  if (exactNameMatches.length > 0) {
    confidence = 'high';
    reason = `Exact name match found: ${exactNameMatches.length} treatment(s) with same name`;
  } else if (similarEntities.length > 0) {
    const highestSimilarity = Math.max(...similarEntities.map(e => e.similarity));
    if (highestSimilarity > 0.9) {
      confidence = 'high';
    } else if (highestSimilarity > 0.85) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }
    reason = `Similar treatments found: ${similarEntities.length} treatment(s) with ${(highestSimilarity * 100).toFixed(0)}% similarity`;
  } else {
    reason = 'No duplicates detected';
  }

  return {
    isDuplicate,
    confidence,
    reason,
    similarEntities: similarEntities.slice(0, 5), // Limit to top 5
  };
}

export async function checkDuplicates(
  entityType: 'clinic' | 'doctor' | 'job' | 'blog' | 'treatment',
  entity: any,
  user?: any
): Promise<DuplicateCheck> {
  if (entityType === 'clinic') {
    return await checkClinicDuplicates(entity);
  } else if (entityType === 'doctor') {
    return await checkDoctorDuplicates(entity, user || {});
  } else if (entityType === 'job') {
    return await checkJobDuplicates(entity);
  } else if (entityType === 'treatment') {
    return await checkTreatmentDuplicates(entity);
  } else {
    return await checkBlogDuplicates(entity);
  }
}
