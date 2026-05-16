import dbConnect from "../../../lib/database";
import { getUserFromReq } from "../lead-ms/auth";
import PatientRegistration from "../../../models/PatientRegistration";
import MembershipPlan from "../../../models/MembershipPlan";
import Package from "../../../models/Package";
import UserPackage from "../../../models/UserPackage";
import Billing from "../../../models/Billing";
import mongoose from "mongoose";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!["clinic", "agent", "doctor", "doctorStaff", "staff", "admin"].includes(user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { type, sourcePatientId, targetPatientId, membershipId, packageId } = req.body || {};
    if (!type || !sourcePatientId || !targetPatientId) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    if (sourcePatientId === targetPatientId) {
      return res.status(400).json({ success: false, message: "Cannot transfer to the same patient" });
    }

    const source = await PatientRegistration.findById(sourcePatientId);
    const target = await PatientRegistration.findById(targetPatientId);
    if (!source || !target) {
      return res.status(404).json({ success: false, message: "Source or target patient not found" });
    }

    if (type === "membership") {
      if (!membershipId) {
        return res.status(400).json({ success: false, message: "membershipId is required" });
      }
      const hasSelectedInArray = Array.isArray(source.memberships) && source.memberships.some(m => String(m.membershipId) === String(membershipId));
      const hasSelectedAsSingle = source.membership === "Yes" && String(source.membershipId) === String(membershipId);
      if (!hasSelectedInArray && !hasSelectedAsSingle) {
        return res.status(400).json({ success: false, message: "Source patient does not have selected membership" });
      }

      const plan = await MembershipPlan.findById(membershipId);
      if (!plan) {
        return res.status(404).json({ success: false, message: "Membership plan not found" });
      }

      // Find original membership entry to copy payment details
      const sourceMembEntry = (source.memberships || []).find(m => String(m.membershipId) === String(membershipId)) || {};
      const { paymentStatus = "Unpaid", paidAmount = 0, paymentMethod = "" } = sourceMembEntry;

      const total = plan.benefits?.freeConsultations || 0;
      // Determine selected membership time window to count used consultations correctly
      let startDate = null;
      let endDate = null;
      if (hasSelectedInArray) {
        const entry = source.memberships.find(m => String(m.membershipId) === String(membershipId));
        startDate = entry?.startDate || null;
        endDate = entry?.endDate || null;
      } else if (hasSelectedAsSingle) {
        startDate = source.membershipStartDate || null;
        endDate = source.membershipEndDate || null;
      }
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);

      const freeBills = await Billing.find({
        patientId: sourcePatientId,
        isFreeConsultation: true,
        ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
      }).select("sessions createdAt");
      let used = 0;
      freeBills.forEach(b => { used += (b.sessions || 1); });
      if (used === 0) {
        const allBills = await Billing.find({
          patientId: sourcePatientId,
          $or: [{ service: "Treatment" }, { service: "Package" }],
          ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
        }).select("sessions createdAt").sort({ createdAt: 1 });
        for (const b of allBills) {
          if (used >= total) break;
          const s = b.sessions || 1;
          const remainingAllowed = total - used;
          used += Math.min(s, remainingAllowed);
        }
      }
      const remaining = Math.max(0, total - used);
      if (remaining <= 0) {
        return res.status(400).json({ success: false, message: "No remaining membership benefits to transfer" });
      }

      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        // Remove the membership from source patient (they transferred it out)
        if (hasSelectedAsSingle) {
          source.membership = "No";
          source.membershipId = undefined;
          source.membershipStartDate = undefined;
          source.membershipEndDate = undefined;
        }
        source.memberships = (Array.isArray(source.memberships) ? source.memberships.filter(m => String(m.membershipId) !== String(membershipId)) : []);
        source.hasTransferredOut = true;
        if (plan?.benefits?.priorityBooking) {
          source.transferredOutMembershipPriority = true;
        }
        source.membershipTransfers = source.membershipTransfers || [];
        source.membershipTransfers.push({
          type: "out",
          membershipId,
          membershipName: plan.name,
          startDate,
          endDate,
          toPatientId: target._id,
          transferredFreeConsultations: remaining,
          discountPercentageTransferred: plan.benefits?.discountPercentage || 0,
          paymentStatus,
          paidAmount,
          paymentMethod,
          transferDate: new Date(),
        });
        await source.save({ session });

        // Assign to target: preserve source membership period, and allow multiple entries (even same plan)
        target.membership = "Yes";
        if (!target.membershipId) {
          target.membershipId = membershipId; // keep single for backward-compat only if empty
        }
        target.memberships = Array.isArray(target.memberships) ? target.memberships : [];
        target.memberships.push({ 
          membershipId, 
          startDate, 
          endDate,
          paymentStatus,
          paidAmount,
          paymentMethod,
        });
        target.membershipTransfers = target.membershipTransfers || [];
        target.membershipTransfers.push({
          type: "in",
          membershipId,
          membershipName: plan.name,
          startDate,
          endDate,
          fromPatientId: source._id,
          transferredFreeConsultations: remaining,
          discountPercentageTransferred: plan.benefits?.discountPercentage || 0,
          paymentStatus,
          paidAmount,
          paymentMethod,
          transferDate: new Date(),
        });
        await target.save({ session });

        await session.commitTransaction();
      } catch (e) {
        await session.abortTransaction();
        throw e;
      } finally {
        session.endSession();
      }

      return res.status(200).json({
        success: true,
        message: `Transferred ${remaining} free consultation(s)`,
        data: { type, remainingTransferred: remaining }
      });
    }

    if (type === "package") {
      if (!packageId) {
        return res.status(400).json({ success: false, message: "packageId is required" });
      }

      let pkg = null;
      let isUserPackage = false;
      let sourcePkgEntry = null;

      // Check standard packages first (stored in source.packages array)
      const hasStandardPackage = Array.isArray(source.packages) && source.packages.some(p => String(p.packageId) === String(packageId));
      
      if (hasStandardPackage) {
        pkg = await Package.findById(packageId);
        sourcePkgEntry = source.packages.find(p => String(p.packageId) === String(packageId)) || {};
      } else {
        // Check UserPackage model for user-created packages
        const userPkg = await UserPackage.findOne({ _id: packageId, patientId: sourcePatientId });
        if (userPkg) {
          pkg = userPkg;
          isUserPackage = true;
          sourcePkgEntry = {
            paymentStatus: userPkg.paymentStatus,
            paidAmount: userPkg.totalPrice || 0,
            paymentMethod: "", // UserPackage doesn't track method directly in its schema
          };
        }
      }

      if (!pkg) {
        return res.status(400).json({ success: false, message: "Source patient does not have selected package" });
      }

      // Find original package entry to copy payment details
      const { paymentStatus = "Unpaid", paidAmount = 0, paymentMethod = "" } = sourcePkgEntry;
      const packageName = isUserPackage ? pkg.packageName : pkg.name;
      const total = Number(pkg.totalSessions) || 0;
      let remaining = 0;

      if (isUserPackage) {
        remaining = Number(pkg.remainingSessions) || 0;
      } else {
        const billings = await Billing.find({
          patientId: sourcePatientId,
          service: "Package",
          package: packageName,
        }).select("sessions");
        let used = 0;
        billings.forEach(b => { used += (b.sessions || 0); });
        remaining = Math.max(0, total - used);
      }

      if (remaining <= 0) {
        return res.status(400).json({ success: false, message: "No remaining package sessions to transfer" });
      }

      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        if (isUserPackage) {
          // For UserPackage, we just transfer ownership of the document
          pkg.patientId = targetPatientId;
          await pkg.save({ session });
        } else {
          // For standard package, we remove from source and add to target
          const sourcePackage = (Array.isArray(source.packages) ? source.packages.find(p => String(p.packageId) === String(packageId)) : {});
          source.packages = (Array.isArray(source.packages) ? source.packages.filter(p => String(p.packageId) !== String(packageId)) : []);
          
          target.packages = Array.isArray(target.packages) ? target.packages : [];
          target.packages.push({ 
            packageId, 
            packageName,
            packageSoldBy: sourcePackage.packageSoldBy || user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown',
            assignedDate: new Date(),
            paymentStatus,
            paidAmount,
            paymentMethod,
          });
        }

        // Common logging for transfer history
        source.hasTransferredOut = true;
        source.packageTransfers = source.packageTransfers || [];
        source.packageTransfers.push({
          type: "out",
          packageId,
          packageName,
          isUserPackage,
          toPatientId: target._id,
          transferredSessions: remaining,
          paymentStatus,
          paidAmount,
          paymentMethod,
          transferDate: new Date(),
        });
        await source.save({ session });

        target.packageTransfers = target.packageTransfers || [];
        target.packageTransfers.push({
          type: "in",
          packageId,
          packageName,
          isUserPackage,
          fromPatientId: source._id,
          transferredSessions: remaining,
          paymentStatus,
          paidAmount,
          paymentMethod,
          transferDate: new Date(),
        });
        await target.save({ session });

        await session.commitTransaction();
      } catch (e) {
        await session.abortTransaction();
        throw e;
      } finally {
        session.endSession();
      }

      return res.status(200).json({
        success: true,
        message: `Transferred ${remaining} package session(s)`,
        data: { type, remainingTransferred: remaining }
      });
    }

    return res.status(400).json({ success: false, message: "Invalid transfer type" });
  } catch (error) {
    console.error("Error transferring benefits:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to transfer benefits" });
  }
}
