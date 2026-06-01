import path from 'path';
import fs from 'fs';
import multer from 'multer';
import dbConnect from '../../../lib/database';
import Clinic from '../../../models/Clinic';
import User from '../../../models/Users';
import Treatment from '../../../models/Treatment';
import ClinicPermission from '../../../models/ClinicPermission';
import ClinicNavigationItem from '../../../models/ClinicNavigationItem';


// Disable default body parsing
export const config = {
  api: {
    bodyParser: false,
  },
};

// Ensure directory exists
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'public/uploads/clinic');
    ensureDirectoryExists(uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

const upload = multer({ storage });
const uploadMiddleware = upload.fields([
  { name: 'clinicPhoto', maxCount: 1 },
  { name: 'licenseDocument', maxCount: 1 },
]);

const runMiddleware = (req, res, fn) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    await runMiddleware(req, res, uploadMiddleware);

    const {
      email,
      name,
      address,
      pricing,
      timings,
      treatments, // Expecting JSON stringified array of treatment refs
      latitude,
      longitude,
    } = req.body;

    // Find user with case-insensitive email search
    const user = await User.findOne({ 
      email: email.toLowerCase().trim(), 
      role: 'clinic' 
    });
    
    if (!user) {
      console.error('Clinic user not found for email:', email);
      return res.status(404).json({ message: 'Clinic user not found. Please ensure owner registration completed successfully.' });
    }
    
    console.log('Found clinic user:', user._id, user.email);

    const clinicPhotoPath = req.files?.['clinicPhoto']?.[0]?.path
      ? req.files['clinicPhoto'][0].path.replace('public', '').replace(/\\/g, '/')
      : '';

    const licensePath = req.files?.['licenseDocument']?.[0]?.path
      ? req.files['licenseDocument'][0].path.replace('public', '').replace(/\\/g, '/')
      : '';

    // 🧠 Parse the treatment references (array of { mainTreatment, mainTreatmentSlug, subTreatments })
    let parsedTreatments = [];
    if (treatments) {
      try {
        parsedTreatments = JSON.parse(treatments); // from JSON.stringify on frontend
        
        // Ensure each treatment has the correct structure
        if (Array.isArray(parsedTreatments)) {
          parsedTreatments = parsedTreatments.map(treatment => {
            if (typeof treatment === 'string') {
              // Convert string to object format
              return {
                mainTreatment: treatment,
                mainTreatmentSlug: treatment.toLowerCase().replace(/\s+/g, '-'),
                subTreatments: []
              };
            } else if (treatment.mainTreatment && treatment.mainTreatmentSlug) {
              // Ensure subTreatments array exists
              return {
                ...treatment,
                subTreatments: treatment.subTreatments || []
              };
            }
            return treatment;
          });
        }
      } catch (error) {
        console.error('Error parsing treatments:', error);
        // If parsing fails, use empty array instead of throwing error
        parsedTreatments = [];
      }
    }

    // 🧠 Handle timings format
    let finalTimings = [];
    const VALID_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    if (typeof timings === 'string') {
      // If it's a simple string like "8AM-9PM", we try to use it as the timing for all days
      // Or we can just use defaults if it's too complex to parse here
      // For now, let's create a default structure using the string if possible
      
      // Basic parsing of "8AM-9PM" or similar
      let openingTime = '09:00 AM';
      let closingTime = '06:00 PM';
      
      if (timings.includes('-')) {
        const parts = timings.split('-').map(p => p.trim());
        if (parts.length === 2) {
          // Very simple normalization: "8AM" -> "08:00 AM", "9PM" -> "09:00 PM"
          const normalize = (t) => {
            let time = t.toUpperCase();
            if (!time.includes(':')) {
              const match = time.match(/(\d+)\s*(AM|PM)/);
              if (match) {
                const hour = match[1].padStart(2, '0');
                const period = match[2];
                return `${hour}:00 ${period}`;
              }
            }
            return t;
          };
          openingTime = normalize(parts[0]);
          closingTime = normalize(parts[1]);
        }
      }

      finalTimings = VALID_DAYS.map(day => ({
        day,
        isOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].includes(day), // Most are open Mon-Sat
        openingTime,
        closingTime,
        breakStart: '01:00 PM',
        breakEnd: '02:00 PM',
      }));
    } else if (Array.isArray(timings)) {
      finalTimings = timings;
    } else {
      // Use defaults if nothing provided or invalid format
      finalTimings = VALID_DAYS.map(day => ({
        day,
        isOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].includes(day),
        openingTime: '09:00 AM',
        closingTime: '06:00 PM',
        breakStart: '01:00 PM',
        breakEnd: '02:00 PM',
      }));
    }

    // ✅ Optional validation: check if mainTreatment exists in DB
    if (parsedTreatments && parsedTreatments.length > 0) {
      for (let t of parsedTreatments) {
        let found = await Treatment.findOne({ name: t.mainTreatment });
        if (!found) {
          // Add the custom treatment to the database if it doesn't exist
          found = await Treatment.create({
            name: t.mainTreatment,
            slug: t.mainTreatmentSlug,
            subTreatments: t.subTreatments || []
          });
        }
      }
    }

    // Generate slug preview (not locked yet, will be locked on approval)
    let slugPreview = null;
    let slugPreviewUrl = null;
    let slugUserMessage = null;
    
    try {
      const { slugify, generateUniqueSlug } = await import('../../../lib/utils');
      
      // Extract city from address
      let cityName = '';
      if (address) {
        const addressParts = address.split(',').map(part => part.trim());
        cityName = addressParts[0] || '';
      }

      // Generate base slug
      const baseSlugFromName = slugify(name);
      let baseSlug = baseSlugFromName;
      if (cityName) {
        const citySlug = slugify(cityName);
        baseSlug = `${baseSlugFromName}-${citySlug}`;
      }

      if (baseSlug) {
        // Check if slug exists (checking locked slugs only)
        const checkExists = async (slugToCheck) => {
          const existing = await Clinic.findOne({
            slug: slugToCheck,
            slugLocked: true,
          });
          return !!existing;
        };

        // Generate unique slug
        const finalSlug = await generateUniqueSlug(baseSlug, checkExists);
        slugPreview = finalSlug;
        
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://zeva360.com';
        slugPreviewUrl = `${baseUrl}/clinics/${finalSlug}`;
        
        // User-friendly message
        const collisionResolved = finalSlug !== baseSlug;
        if (collisionResolved && cityName) {
          slugUserMessage = `Good news! Another clinic already uses this name, so we added your city (${cityName}) to create a unique page for you.`;
        } else if (collisionResolved) {
          slugUserMessage = 'Good news! Another clinic already uses this name, so we added a number to create a unique page for you.';
        } else {
          slugUserMessage = 'Your clinic page is ready! We created a unique URL based on your clinic name' + 
            (cityName ? ` and city (${cityName})` : '') + 
            ' to help patients find you easily.';
        }
      }
    } catch (slugError) {
      console.error('❌ Slug preview generation error (non-fatal):', slugError.message);
      // Continue with clinic creation even if slug preview fails
    }

    // Create clinic
    const clinic = await Clinic.create({
      owner: user._id,
      name,
      address,
      treatments: parsedTreatments,
      pricing,
      timings: finalTimings,
      photos: clinicPhotoPath ? [clinicPhotoPath] : [],
      licenseDocumentUrl: licensePath || null,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
      registeredAt: new Date(), // Set trial start time for new users
    });

    // Create default permissions with all actions enabled for the clinic
    try {
      // Fetch all navigation items for clinic role to build default permissions
      const navigationItems = await ClinicNavigationItem.find({
        role: 'clinic',
        isActive: true
      }).lean();

      // If no navigation items exist, create a minimal set of default permissions
      if (!navigationItems || navigationItems.length === 0) {
        console.log('⚠️ No navigation items found, creating minimal default permissions');
        
        // Create minimal default permissions
        const minimalPermissions = [
          {
            module: 'clinic_dashboard',
            subModules: [],
            actions: {
              all: true,
              create: true,
              read: true,
              update: true,
              delete: true
            }
          },
          {
            module: 'clinic_health_center',
            subModules: [],
            actions: {
              all: true,
              create: true,
              read: true,
              update: true,
              delete: true
            }
          },
          {
            module: 'clinic_staff_management',
            subModules: [],
            actions: {
              all: true,
              create: true,
              read: true,
              update: true,
              delete: true
            }
          }
        ];

        await ClinicPermission.create({
          clinicId: clinic._id,
          role: 'clinic',
          permissions: minimalPermissions,
          grantedBy: user._id,
          isActive: true,
          lastModified: new Date()
        });

        console.log('✅ Minimal default permissions created for clinic:', clinic._id);
      } else {
        // Build default permissions with all actions set to true
        const defaultPermissions = navigationItems.map(navItem => ({
          module: navItem.moduleKey,
          subModules: (navItem.subModules || []).map(subModule => ({
            name: subModule.name,
            path: subModule.path || '',
            icon: subModule.icon || '📄',
            order: subModule.order || 0,
            actions: {
              all: true,
              create: true,
              read: true,
              update: true,
              delete: true
            }
          })),
          actions: {
            all: true,
            create: true,
            read: true,
            update: true,
            delete: true
          }
        }));

        // Create ClinicPermission document with all permissions enabled
        await ClinicPermission.create({
          clinicId: clinic._id,
          role: 'clinic',
          permissions: defaultPermissions,
          grantedBy: user._id,
          isActive: true,
          lastModified: new Date()
        });

        console.log('✅ Default permissions created for clinic:', clinic._id, 'with', defaultPermissions.length, 'modules');
      }
    } catch (permError) {
      console.error('⚠️ Error creating default permissions (non-fatal):', permError.message);
      // Continue even if permission creation fails - clinic is still created
    }

    return res.status(200).json({ 
      message: 'Clinic saved', 
      clinic,
      slug_preview: slugPreview ? {
        slug: slugPreview,
        url: slugPreviewUrl,
        user_message: slugUserMessage,
      } : null,
    });
  } catch (err) {
    console.error('❌ Clinic Save Error:', err);
    return res.status(500).json({
      message: 'Error saving clinic',
      error: err.message || 'Internal server error',
    });
  }
}
