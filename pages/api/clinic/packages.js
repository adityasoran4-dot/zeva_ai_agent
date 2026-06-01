import dbConnect from "../../../lib/database";
import Package from "../../../models/Package";
import Clinic from "../../../models/Clinic";
import User from "../../../models/Users";
import { getUserFromReq } from "../lead-ms/auth";
import { getClinicIdFromUser, checkClinicPermission } from "../lead-ms/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  // Verify authentication
  let user;
  try {
    user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    // Allow clinic, doctor, agent, doctorStaff, and staff roles
    if (!["clinic", "doctor", "agent", "doctorStaff", "staff"].includes(user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  // Get clinic ID from user
  const { clinicId, error: clinicError } = await getClinicIdFromUser(user);
  if (clinicError || !clinicId) {
    return res.status(403).json({ 
      success: false,
      message: clinicError || "Unable to determine clinic access" 
    });
  }

  // GET: Fetch all packages for this clinic
  if (req.method === "GET") {
    try {
      // Check read permission
      const { hasPermission, error: permError } = await checkClinicPermission(
        clinicId,
        "clinic_addRoom",
        "read"
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: permError || "You do not have permission to view packages",
        });
      }

      const packages = await Package.find({ clinicId })
        .sort({ createdAt: -1 })
        .lean();

      const normalized = packages
        .filter((pkg) => pkg.clinicId && pkg.clinicId.toString() === clinicId.toString())
        .map((pkg) => {
          const totalSessions =
            pkg.totalSessions ??
            (Array.isArray(pkg.treatments)
              ? pkg.treatments.reduce((sum, t) => sum + (parseInt(t.sessions) || 1), 0)
              : 0);
          const sessionPrice =
            pkg.sessionPrice ??
            (pkg.totalPrice && totalSessions > 0
              ? Number((pkg.totalPrice / totalSessions).toFixed(2))
              : (pkg.price ?? 0)); // fallback for legacy "price"
          const totalPrice =
            pkg.totalPrice ??
            (sessionPrice && totalSessions > 0
              ? Number((sessionPrice * totalSessions).toFixed(2))
              : (pkg.price ?? 0));
          return {
            _id: pkg._id.toString(),
            name: pkg.name,
            price: sessionPrice, // backward compatible field used by UI
            totalPrice,
            totalSessions,
            sessionPrice,
            treatments: pkg.treatments || [],
            validityInMonths: pkg.validityInMonths || 0,
            startDate: pkg.startDate,
            endDate: pkg.endDate,
            createdAt: pkg.createdAt,
            updatedAt: pkg.updatedAt,
          };
        });

      return res.status(200).json({ success: true, packages: normalized });
    } catch (error) {
      console.error("Error fetching packages:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch packages" });
    }
  }

  // POST: Create a new package
  if (req.method === "POST") {
    try {
      // Check create permission
      const { hasPermission, error: permError } = await checkClinicPermission(
        clinicId,
        "clinic_addRoom",
        "create",
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: permError || "You do not have permission to create packages",
        });
      }

      const { name, totalPrice: bodyTotalPrice, price: legacyPrice, treatments, validityInMonths, startDate, endDate } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: "Package name is required" });
      }

      const totalPrice = bodyTotalPrice !== undefined ? parseFloat(bodyTotalPrice) : parseFloat(legacyPrice);
      if (totalPrice === undefined || totalPrice === null || isNaN(totalPrice) || totalPrice < 0) {
        return res.status(400).json({ success: false, message: "Valid totalPrice is required" });
      }

      if (!treatments || !Array.isArray(treatments) || treatments.length === 0) {
        return res.status(400).json({ success: false, message: "At least one treatment is required" });
      }

      for (const treatment of treatments) {
        if (!treatment.treatmentName || !treatment.treatmentName.trim()) {
          return res.status(400).json({ success: false, message: "Treatment name is required for all treatments" });
        }
        if (!treatment.sessions || treatment.sessions < 1) {
          return res.status(400).json({ success: false, message: "Valid sessions (minimum 1) is required for all treatments" });
        }
        if (treatment.allocatedPrice === undefined || treatment.allocatedPrice === null || isNaN(treatment.allocatedPrice) || treatment.allocatedPrice < 0) {
          return res.status(400).json({ success: false, message: "Valid allocated price is required for all treatments" });
        }
      }

      // Validate total allocated price equals total package price
      const calculatedTotalAllocated = treatments.reduce((sum, t) => sum + (parseFloat(t.allocatedPrice) || 0), 0);
      if (Math.abs(calculatedTotalAllocated - totalPrice) > 0.01) {
        return res.status(400).json({ 
          success: false, 
          message: `Total allocated treatment prices (${calculatedTotalAllocated.toFixed(2)}) must equal the package price (${totalPrice.toFixed(2)})` 
        });
      }

      // Check if package with same name already exists for this clinic
      const existingPackage = await Package.findOne({
        clinicId,
        name: name.trim(),
      });

      if (existingPackage) {
        return res.status(400).json({
          success: false,
          message: "A package with this name already exists",
        });
      }

      const normalizedTreatments = treatments.map((t) => {
        const allocatedPrice = parseFloat(t.allocatedPrice) || 0;
        const sessions = parseInt(t.sessions) || 1;
        const sessionPrice = sessions > 0 ? Number((allocatedPrice / sessions).toFixed(2)) : 0;
        return {
          treatmentName: t.treatmentName.trim(),
          treatmentSlug: t.treatmentSlug || "",
          allocatedPrice,
          sessions,
          sessionPrice,
        };
      });
      
      // Recalculate total sessions from normalized treatments
      const totalSessions = normalizedTreatments.reduce((sum, t) => sum + (t.sessions || 1), 0);
      
      // Calculate overall session price (for backward compatibility)
      const sessionPrice = totalSessions > 0 ? Number((totalPrice / totalSessions).toFixed(2)) : Number(totalPrice.toFixed(2));
      
      // Create the package
      const newPackage = await Package.create({
        clinicId,
        name: name.trim(),
        totalPrice,
        totalSessions,
        sessionPrice,
        treatments: normalizedTreatments,
        validityInMonths: parseInt(validityInMonths) || 0,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        createdBy: user._id,
      });

      return res.status(201).json({
        success: true,
        message: "Package created successfully",
        package: {
          _id: newPackage._id.toString(),
          name: newPackage.name,
          price: newPackage.totalSessions > 0 ? Number((newPackage.totalPrice / newPackage.totalSessions).toFixed(2)) : newPackage.totalPrice,
          totalPrice: newPackage.totalPrice,
          totalSessions: newPackage.totalSessions,
          sessionPrice: newPackage.totalSessions > 0 ? Number((newPackage.totalPrice / newPackage.totalSessions).toFixed(2)) : newPackage.totalPrice,
          validityInMonths: newPackage.validityInMonths,
          startDate: newPackage.startDate,
          endDate: newPackage.endDate,
          treatments: newPackage.treatments || [],
          createdAt: newPackage.createdAt,
          updatedAt: newPackage.updatedAt,
        },
      });
    } catch (error) {
      console.error("Error creating package:", error);
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "A package with this name already exists",
        });
      }
      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: error.message || "Validation error creating package",
        });
      }
      return res.status(500).json({
        success: false,
        message: "Failed to create package",
        error: error.message || "Unknown error",
      });
    }
  }

  // PUT: Update an existing package
  if (req.method === "PUT") {
    try {
      // Check update permission
      const { hasPermission, error: permError } = await checkClinicPermission(
        clinicId,
        "clinic_addRoom",
        "update",
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: permError || "You do not have permission to update packages",
        });
      }

      const { packageId, name, totalPrice, treatments, validityInMonths, startDate, endDate, isActive } = req.body;

      if (!packageId || !name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Package ID and name are required",
        });
      }

      const pkg = await Package.findOne({ _id: packageId, clinicId });
      if (!pkg) {
        return res.status(404).json({ success: false, message: "Package not found" });
      }

      const normalizedName = name.trim();
      const duplicatePackage = await Package.findOne({
        clinicId,
        name: normalizedName,
        _id: { $ne: packageId },
      });

      if (duplicatePackage) {
        return res.status(400).json({
          success: false,
          message: "Another package with this name already exists",
        });
      }

      // If treatments are provided, validate and update them
      if (treatments && Array.isArray(treatments) && treatments.length > 0) {
        // Validate treatments
        for (const treatment of treatments) {
          if (!treatment.treatmentName || !treatment.treatmentName.trim()) {
            return res.status(400).json({ success: false, message: "Treatment name is required for all treatments" });
          }
          if (!treatment.sessions || treatment.sessions < 1) {
            return res.status(400).json({ success: false, message: "Valid sessions (minimum 1) is required for all treatments" });
          }
          if (treatment.allocatedPrice === undefined || treatment.allocatedPrice === null || isNaN(treatment.allocatedPrice) || treatment.allocatedPrice < 0) {
            return res.status(400).json({ success: false, message: "Valid allocated price is required for all treatments" });
          }
        }

        // Validate total allocated price equals total package price
        const calculatedTotalAllocated = treatments.reduce((sum, t) => sum + (parseFloat(t.allocatedPrice) || 0), 0);
        const newTotalPrice = totalPrice !== undefined ? parseFloat(totalPrice) : pkg.totalPrice;
        if (Math.abs(calculatedTotalAllocated - newTotalPrice) > 0.01) {
          return res.status(400).json({ 
            success: false, 
            message: `Total allocated treatment prices (${calculatedTotalAllocated.toFixed(2)}) must equal the package price (${newTotalPrice.toFixed(2)})` 
          });
        }

        // Normalize treatments
        const normalizedTreatments = treatments.map((t) => {
          const allocatedPrice = parseFloat(t.allocatedPrice) || 0;
          const sessions = parseInt(t.sessions) || 1;
          const sessionPrice = sessions > 0 ? Number((allocatedPrice / sessions).toFixed(2)) : 0;
          return {
            treatmentName: t.treatmentName.trim(),
            treatmentSlug: t.treatmentSlug || "",
            allocatedPrice,
            sessions,
            sessionPrice,
          };
        });

        pkg.treatments = normalizedTreatments;
        pkg.totalSessions = normalizedTreatments.reduce((sum, t) => sum + (t.sessions || 1), 0);
        
        if (totalPrice !== undefined) {
          pkg.totalPrice = parseFloat(totalPrice);
        }
      }

      if (validityInMonths !== undefined) {
        pkg.validityInMonths = parseInt(validityInMonths) || 0;
      }
      if (startDate !== undefined) {
        pkg.startDate = startDate ? new Date(startDate) : undefined;
      }
      if (endDate !== undefined) {
        pkg.endDate = endDate ? new Date(endDate) : undefined;
      }
      if (isActive !== undefined) {
        pkg.isActive = isActive;
      }

      pkg.name = normalizedName;
      await pkg.save();

      return res.status(200).json({
        success: true,
        message: "Package updated successfully",
        package: {
          _id: pkg._id.toString(),
          name: pkg.name,
          price: pkg.totalSessions > 0 ? Number((pkg.totalPrice / pkg.totalSessions).toFixed(2)) : pkg.totalPrice,
          totalPrice: pkg.totalPrice,
          totalSessions: pkg.totalSessions,
          sessionPrice: pkg.totalSessions > 0 ? Number((pkg.totalPrice / pkg.totalSessions).toFixed(2)) : pkg.totalPrice,
          validityInMonths: pkg.validityInMonths,
          startDate: pkg.startDate,
          endDate: pkg.endDate,
          treatments: pkg.treatments || [],
          createdAt: pkg.createdAt,
          updatedAt: pkg.updatedAt,
        },
      });
    } catch (error) {
      console.error("Error updating package:", error);
      return res.status(500).json({ success: false, message: "Failed to update package" });
    }
  }

  // DELETE: Delete a package
  if (req.method === "DELETE") {
    try {
      // Check delete permission
      const { hasPermission, error: permError } = await checkClinicPermission(
        clinicId,
        "clinic_addRoom",
        "delete",
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: permError || "You do not have permission to delete packages",
        });
      }

      const { packageId } = req.query;

      if (!packageId) {
        return res.status(400).json({ success: false, message: "Package ID is required" });
      }

      // Verify the package belongs to this clinic
      const pkg = await Package.findOne({ _id: packageId, clinicId });
      if (!pkg) {
        return res.status(404).json({ success: false, message: "Package not found" });
      }

      await Package.findByIdAndDelete(packageId);

      return res.status(200).json({
        success: true,
        message: "Package deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting package:", error);
      return res.status(500).json({ success: false, message: "Failed to delete package" });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
  return res.status(405).json({ success: false, message: "Method not allowed" });
}

