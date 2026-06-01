import dbConnect from "../../../lib/database";
import Service from "../../../models/Service";
import Clinic from "../../../models/Clinic";
import UserPackage from "../../../models/UserPackage";

export default async function handler(req, res) {
  await dbConnect();

  const { method } = req;

  // Handle OPTIONS request for CORS
  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET - Fetch services and treatments for a clinic (public endpoint)
  if (method === 'GET') {
    try {
      const { clinicId, patientId } = req.query;

      if (!clinicId && !patientId) {
        return res.status(400).json({ success: false, message: "Clinic ID or Patient ID is required" });
      }

      let finalClinicId = clinicId;

      // If no clinicId, fetch from patient record
      if (!finalClinicId && patientId) {
        const PatientRegistration = (await import("../../../models/PatientRegistration")).default;
        const patient = await PatientRegistration.findById(patientId).select('clinicId').lean();
        if (patient) {
          finalClinicId = patient.clinicId;
        }
      }

      if (!finalClinicId) {
        return res.status(400).json({ success: false, message: "Clinic ID is required" });
      }

      // Fetch services for the clinic
      const services = await Service.find({ clinicId: finalClinicId, isActive: true })
        .select('name serviceSlug price clinicPrice durationMinutes')
        .sort({ name: 1 })
        .lean();

      // Fetch clinic-specific treatments from Clinic model
      const clinic = await Clinic.findById(finalClinicId)
        .select('treatments')
        .lean();

      // Filter only enabled treatments and format them
      const treatments = clinic?.treatments
        ?.filter((t) => t.enabled !== false)
        .map((t) => ({
          name: t.mainTreatment,
          slug: t.mainTreatmentSlug,
          subcategories: t.subTreatments
            ?.filter((st) => st.enabled !== false)
            .map((st) => ({
              name: st.name,
              slug: st.slug,
              price: st.price,
            })) || []
        })) || [];

      // If patientId provided, fetch existing packages for this patient
      let existingPackages = [];
      if (patientId) {
        existingPackages = await UserPackage.find({ 
          patientId, 
          clinicId: finalClinicId,
        })
        .select('_id packageName totalSessions remainingSessions totalPrice sessionPrice startDate endDate treatments approvalStatus status paymentStatus createdAt')
        .sort({ createdAt: -1 })
        .lean();
      }

      return res.status(200).json({ 
        success: true, 
        services,
        treatments,
        existingPackages
      });
    } catch (error) {
      console.error("Error fetching services/treatments:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch data" });
    }
  }

  // POST /approve - Approve a package and sync to PatientRegistration (MUST BE BEFORE GENERIC POST)
  if (method === 'POST' && req.query.action === 'approve') {
    try {
      const { packageId } = req.body;

      if (!packageId) {
        return res.status(400).json({ success: false, message: "Package ID is required" });
      }

      const userPackage = await UserPackage.findById(packageId);
      if (!userPackage) {
        return res.status(404).json({ success: false, message: "Package not found" });
      }

      if (userPackage.approvalStatus === 'approved') {
        return res.status(400).json({ success: false, message: "Package already approved" });
      }

      // Update approval status
      userPackage.approvalStatus = 'approved';
      userPackage.status = 'active';
      
      // Add package to patient registration
      const PatientRegistration = (await import("../../../models/PatientRegistration")).default;
      console.log("=== APPROVING PACKAGE ===");
      console.log("UserPackage ID:", userPackage._id);
      console.log("Patient ID:", userPackage.patientId);
      console.log("Package Name:", userPackage.packageName);
      console.log("Treatments:", JSON.stringify(userPackage.treatments, null, 2));
      
      const updateResult = await PatientRegistration.findByIdAndUpdate(userPackage.patientId, {
        $push: {
          userPackages: {
            packageId: userPackage._id,
            packageName: userPackage.packageName,
            totalSessions: userPackage.totalSessions,
            remainingSessions: userPackage.remainingSessions,
            totalPrice: userPackage.totalPrice,
            treatments: userPackage.treatments,
            approvalStatus: 'approved',
          }
        }
      }, { new: true });
      
      console.log("PatientRegistration update result:", updateResult?._id);
      console.log("==========================");
      
      await userPackage.save();

      return res.status(200).json({ 
        success: true, 
        message: "Package approved successfully",
        package: userPackage
      });
    } catch (error) {
      console.error("Error approving package:", error);
      return res.status(500).json({ success: false, message: "Failed to approve package" });
    }
  }

  // POST - Create a new package for a patient
  if (method === 'POST') {
    try {
      const { 
        clinicId, 
        patientId, 
        patientName, 
        patientMobile,
        packageName, 
        totalPrice, 
        totalSessions, 
        sessionPrice, 
        treatments, 
        endDate,
        createdBy 
      } = req.body;

      if (!clinicId || !patientId || !packageName || !totalPrice || !totalSessions) {
        return res.status(400).json({ 
          success: false, 
          message: "Missing required fields" 
        });
      }

      // Calculate remaining sessions (same as total initially)
      const remainingSessions = totalSessions;

      const newPackage = new UserPackage({
        patientId,
        clinicId,
        packageName,
        totalPrice,
        totalSessions,
        remainingSessions,
        sessionPrice: sessionPrice || (totalPrice / totalSessions),
        treatments: treatments || [],
        endDate: endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year
        status: 'active',
        approvalStatus: 'pending',
        paymentStatus: 'paid',
        createdBy: createdBy || null,
      });

      const savedPackage = await newPackage.save();

      return res.status(201).json({ 
        success: true, 
        message: "Package created successfully",
        package: savedPackage
      });
    } catch (error) {
      console.error("Error creating package:", error);
      return res.status(500).json({ success: false, message: "Failed to create package" });
    }
  }

  // PUT - Update package (e.g., mark sessions as used, approve/reject)
  if (method === 'PUT') {
    try {
      const { packageId, treatmentIndex, sessionsUsed, approvalStatus } = req.body;

      if (!packageId) {
        return res.status(400).json({ success: false, message: "Package ID is required" });
      }

      const userPackage = await UserPackage.findById(packageId);
      if (!userPackage) {
        return res.status(404).json({ success: false, message: "Package not found" });
      }

      // Handle approval status update
      if (approvalStatus) {
        userPackage.approvalStatus = approvalStatus;
        if (approvalStatus === 'approved') {
          userPackage.status = 'active';
          
          // Add package to patient registration
          const PatientRegistration = (await import("../../../models/PatientRegistration")).default;
          console.log("=== APPROVING PACKAGE ===");
          console.log("UserPackage ID:", userPackage._id);
          console.log("Patient ID:", userPackage.patientId);
          console.log("Package Name:", userPackage.packageName);
          
          const updateResult = await PatientRegistration.findByIdAndUpdate(userPackage.patientId, {
            $push: {
              userPackages: {
                packageId: userPackage._id,
                packageName: userPackage.packageName,
                totalSessions: userPackage.totalSessions,
                remainingSessions: userPackage.remainingSessions,
                totalPrice: userPackage.totalPrice,
                treatments: userPackage.treatments,
                approvalStatus: 'approved',
              }
            }
          }, { new: true });
          
          console.log("PatientRegistration update result:", updateResult?._id);
          console.log("==========================");
        } else if (approvalStatus === 'rejected') {
          userPackage.status = 'cancelled';
        }
      }

      // Update used sessions for a specific treatment
      if (treatmentIndex !== undefined && sessionsUsed !== undefined) {
        if (userPackage.treatments && userPackage.treatments[treatmentIndex]) {
          userPackage.treatments[treatmentIndex].usedSessions = 
            (userPackage.treatments[treatmentIndex].usedSessions || 0) + (sessionsUsed || 1);
          
          // Recalculate remaining sessions
          const totalUsed = userPackage.treatments.reduce((sum, t) => sum + (t.usedSessions || 0), 0);
          userPackage.remainingSessions = userPackage.totalSessions - totalUsed;
          
          if (userPackage.remainingSessions <= 0) {
            userPackage.status = 'completed';
          }
        }
      }

      await userPackage.save();

      return res.status(200).json({ 
        success: true, 
        message: "Package updated successfully",
        package: userPackage
      });
    } catch (error) {
      console.error("Error updating package:", error);
      return res.status(500).json({ success: false, message: "Failed to update package" });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
