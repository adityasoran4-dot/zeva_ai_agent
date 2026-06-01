/**
 * Heading Generator Service
 * 
 * Purpose: Prevent duplicate H1s
 * Returns structured H1/H2 plan
 */

export interface HeadingPlan {
  h1: string;
  h2: string[];
  h3?: string[];
}

/**
 * Generate heading plan for clinic
 */
export function generateClinicHeadings(clinic: any): HeadingPlan {
  const h1 = clinic.name || 'Clinic';
  
  const h2: string[] = [];
  
  if (clinic.treatments && clinic.treatments.length > 0) {
    h2.push('Our Treatments & Services');
  }
  
  if (clinic.address) {
    h2.push('Location & Contact');
  }
  
  if (clinic.pricing) {
    h2.push('Pricing & Consultation Fees');
  }
  
  if (clinic.timings) {
    h2.push('Operating Hours');
  }
  
  // Default headings if none added
  if (h2.length === 0) {
    h2.push('About Us', 'Services', 'Contact');
  }

  const h3: string[] = [];
  if (clinic.treatments) {
    clinic.treatments.forEach((treatment: any) => {
      if (treatment.mainTreatment) {
        h3.push(treatment.mainTreatment);
      }
    });
  }

  return {
    h1,
    h2,
    h3: h3.length > 0 ? h3 : undefined,
  };
}

/**
 * Generate heading plan for doctor
 */
export function generateDoctorHeadings(doctorProfile: any, user: any): HeadingPlan {
  const doctorName = user?.name || 'Doctor';
  const h1 = `Dr. ${doctorName}${doctorProfile.degree ? ` - ${doctorProfile.degree}` : ''}`;
  
  const h2: string[] = [];
  
  if (doctorProfile.degree || doctorProfile.experience) {
    h2.push('Professional Background');
  }
  
  if (doctorProfile.treatments && doctorProfile.treatments.length > 0) {
    h2.push('Specializations & Treatments');
  }
  
  if (doctorProfile.address) {
    h2.push('Location & Contact');
  }
  
  if (doctorProfile.consultationFee) {
    h2.push('Consultation Fees');
  }
  
  if (doctorProfile.timeSlots && doctorProfile.timeSlots.length > 0) {
    h2.push('Availability & Appointments');
  }
  
  // Default headings if none added
  if (h2.length === 0) {
    h2.push('About', 'Services', 'Contact');
  }

  const h3: string[] = [];
  if (doctorProfile.treatments) {
    doctorProfile.treatments.forEach((treatment: any) => {
      if (treatment.mainTreatment) {
        h3.push(treatment.mainTreatment);
      }
    });
  }

  return {
    h1,
    h2,
    h3: h3.length > 0 ? h3 : undefined,
  };
}

/**
 * Generate heading plan for blog
 */
export function generateBlogHeadings(blog: any): HeadingPlan {
  const h1 = blog.title || 'Blog Post';
  
  const h2: string[] = [];
  
  // Extract headings from content if it's HTML
  if (blog.content) {
    // Try to extract H2 tags from HTML content
    const h2Matches = blog.content.match(/<h2[^>]*>(.*?)<\/h2>/gi);
    if (h2Matches && h2Matches.length > 0) {
      h2Matches.forEach((match: string) => {
        const text = match.replace(/<[^>]*>/g, '').trim();
        if (text) {
          h2.push(text);
        }
      });
    }
  }
  
  // If no H2s found in content, use default structure
  if (h2.length === 0) {
    h2.push('Introduction', 'Main Content', 'Conclusion');
  }

  const h3: string[] = [];
  // Extract H3 tags from content if available
  if (blog.content) {
    const h3Matches = blog.content.match(/<h3[^>]*>(.*?)<\/h3>/gi);
    if (h3Matches && h3Matches.length > 0) {
      h3Matches.forEach((match: string) => {
        const text = match.replace(/<[^>]*>/g, '').trim();
        if (text) {
          h3.push(text);
        }
      });
    }
  }

  return {
    h1,
    h2,
    h3: h3.length > 0 ? h3 : undefined,
  };
}

/**
 * Generate heading plan for entity
 */
export function generateHeadings(
  entityType: 'clinic' | 'doctor' | 'job' | 'blog' | 'treatment',
  entity: any
): HeadingPlan {
  if (entityType === 'clinic') {
    return generateClinicHeadings(entity);
  } else if (entityType === 'doctor') {
    const user = entity.user || {};
    return generateDoctorHeadings(entity, user);
  } else if (entityType === 'blog') {
    return generateBlogHeadings(entity);
  } else if (entityType === 'treatment') {
    const subTreatments = entity.subcategories || [];
    const h2Headings = subTreatments.length > 0 
      ? subTreatments.map((sub: any) => sub.name)
      : ['Treatment Details'];
    return {
      h1: entity.name || 'Treatment',
      h2: h2Headings,
    };
  } else {
    // Default for job or unknown types
    return {
      h1: entity.jobTitle || 'Job Posting',
      h2: ['Job Description', 'Requirements', 'How to Apply'],
    };
  }
}

/**
 * Validate heading structure (ensure only one H1)
 */
export function validateHeadings(plan: HeadingPlan): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!plan.h1 || plan.h1.trim() === '') {
    errors.push('H1 is required');
  }

  if (plan.h2 && plan.h2.length === 0) {
    errors.push('At least one H2 is recommended');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

