// pages/api/clinics/generate-slug.js
import dbConnect from "../../../lib/database";
import Clinic from "../../../models/Clinic";
import { getUserFromReq } from "../lead-ms/auth";
import { slugify, generateUniqueSlug } from "../../../lib/utils";

/**
 * Slug Generator API
 * 
 * Purpose: Generate unique, SEO-friendly slugs for clinics
 * When: Called automatically when admin approves a clinic
 * 
 * Flow:
 * 1. Admin approves clinic → triggers this API
 * 2. Generate slug from clinic name (from DB)
 * 3. Check for duplicates and make unique
 * 4. Store slug in clinic document
 * 5. Lock slug (slugLocked = true) to prevent changes
 * 
 * Security:
 * - Admin only access
 * - Only works for approved clinics
 * - Handles duplicate key race conditions
 */

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ 
      success: false, 
      message: "Method not allowed" 
    });
  }

  try {
    // ✅ Protect API - Admin only
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized: Missing or invalid token" 
      });
    }

    if (me.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Forbidden: Admin access only" 
      });
    }

    const { clinicId } = req.body;

    if (!clinicId) {
      return res.status(400).json({
        success: false,
        message: "Clinic ID is required"
      });
    }

    // ✅ Use DB value instead of clinicName from body
    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: "Clinic not found"
      });
    }

    // ✅ Enforce isApproved === true
    if (!clinic.isApproved) {
      return res.status(400).json({
        success: false,
        message: "Slug can only be generated for approved clinics"
      });
    }

    // If slug already exists and is locked, return existing slug
    if (clinic.slug && clinic.slugLocked) {
      return res.status(200).json({
        success: true,
        slug: clinic.slug,
        message: "Slug already exists and is locked",
        locked: true
      });
    }

    // ✅ Generate base slug from clinic name (from DB, not body)
    if (!clinic.name) {
      return res.status(400).json({
        success: false,
        message: "Clinic name is required in database"
      });
    }

    const baseSlug = slugify(clinic.name);

    if (!baseSlug) {
      return res.status(400).json({
        success: false,
        message: "Unable to generate slug from clinic name"
      });
    }

    // Check if slug exists (excluding current clinic)
    const checkSlugExists = async (slug) => {
      const existing = await Clinic.findOne({
        slug: slug,
        _id: { $ne: clinicId },
        slugLocked: true // Only check locked slugs to avoid conflicts
      });
      return !!existing;
    };

    // Generate unique slug
    const uniqueSlug = await generateUniqueSlug(baseSlug, checkSlugExists);

    // ✅ Handle duplicate key race condition
    // Retry logic for MongoDB duplicate key errors (E11000)
    let retries = 3;
    let saved = false;
    let finalSlug = uniqueSlug;

    while (retries > 0 && !saved) {
      try {
        // Try to update with the generated slug
        const updateResult = await Clinic.findByIdAndUpdate(
          clinicId,
          {
            slug: finalSlug,
            slugLocked: true
          },
          { new: true }
        );

        if (updateResult) {
          saved = true;
          return res.status(200).json({
            success: true,
            slug: finalSlug,
            message: "Slug generated and locked successfully",
            clinic: {
              _id: updateResult._id,
              name: updateResult.name,
              slug: updateResult.slug,
              slugLocked: updateResult.slugLocked
            }
          });
        }
      } catch (updateError) {
        // Handle duplicate key error (E11000)
        if (updateError.code === 11000 || updateError.codeName === 'DuplicateKey') {
          // Slug was taken by another process, generate a new one
          retries--;
          if (retries > 0) {
            // Generate a new unique slug with a different counter
            const newBaseSlug = `${baseSlug}-${Date.now()}`;
            finalSlug = await generateUniqueSlug(newBaseSlug, checkSlugExists);
            continue;
          } else {
            throw new Error("Unable to generate unique slug after retries");
          }
        } else {
          // Other error, throw it
          throw updateError;
        }
      }
    }

    // Fallback: use save() method if update fails
    if (!saved) {
      clinic.slug = finalSlug;
      clinic.slugLocked = true;
      
      try {
        await clinic.save();
        return res.status(200).json({
          success: true,
          slug: finalSlug,
          message: "Slug generated and locked successfully",
          clinic: {
            _id: clinic._id,
            name: clinic.name,
            slug: clinic.slug,
            slugLocked: clinic.slugLocked
          }
        });
      } catch (saveError) {
        // Handle duplicate key error on save
        if (saveError.code === 11000 || saveError.codeName === 'DuplicateKey') {
          // Fetch the clinic again to get the current state
          const updatedClinic = await Clinic.findById(clinicId);
          if (updatedClinic && updatedClinic.slug && updatedClinic.slugLocked) {
            return res.status(200).json({
              success: true,
              slug: updatedClinic.slug,
              message: "Slug was already generated by another process",
              clinic: {
                _id: updatedClinic._id,
                name: updatedClinic.name,
                slug: updatedClinic.slug,
                slugLocked: updatedClinic.slugLocked
              }
            });
          }
        }
        throw saveError;
      }
    }

  } catch (error) {
    console.error("❌ Slug Generation Error:", error);
    
    // Handle duplicate key error gracefully
    if (error.code === 11000 || error.codeName === 'DuplicateKey') {
      // Try to fetch the clinic to see if slug was set by another process
      try {
        const clinic = await Clinic.findById(req.body.clinicId);
        if (clinic && clinic.slug && clinic.slugLocked) {
          return res.status(200).json({
            success: true,
            slug: clinic.slug,
            message: "Slug was already generated by another process",
            clinic: {
              _id: clinic._id,
              name: clinic.name,
              slug: clinic.slug,
              slugLocked: clinic.slugLocked
            }
          });
        }
      } catch (fetchError) {
        // Ignore fetch errors, return original error
      }
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
}

