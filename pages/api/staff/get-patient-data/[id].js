// pages/api/staff/get-patient-data/[id].js
import dbConnect from "../../../../lib/database";
import PatientRegistration from "../../../../models/PatientRegistration";
import User from "../../../../models/Users";
import mongoose from "mongoose";
import { getAuthorizedStaffUser } from "../../../../server/staff/authHelpers";
import {
  executeWorkflows,
  WORKFLOW_ENTITY_TYPE,
  WORKFLOW_TRIGGER_TYPE,
} from "../../../../bullmq/workflow";

const hasRole = (user, roles = []) => roles.includes(user.role);

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid ID" });
  }

  try {
    // -------------------------------
    // GET: Fetch Invoice + Patient Info
    // -------------------------------
    if (req.method === "GET") {
      // Authenticate user
      let user;
      try {
        user = await getAuthorizedStaffUser(req);
      } catch (err) {
        return res
          .status(err.status || 401)
          .json({ success: false, message: err.message });
      }

      const invoice = await PatientRegistration.findById(id).lean();

      if (!invoice)
        return res.status(404).json({ message: "Invoice not found" });

      // Check access for agents/doctorStaff
      if (user.role === "agent" || user.role === "doctorStaff") {
        // If patient is not created by the user, check if they are in the same clinic
        if (
          invoice.userId &&
          invoice.userId.toString() !== user._id.toString()
        ) {
          if (user.clinicId) {
            const Clinic = (await import("../../../../models/Clinic")).default;
            const clinic = await Clinic.findById(user.clinicId);
            if (clinic) {
              const User = (await import("../../../../models/Users")).default;
              const clinicUsers = await User.find({
                $or: [{ _id: clinic.owner }, { clinicId: user.clinicId }],
              }).select("_id");

              const allowedIds = clinicUsers.map((u) => u._id.toString());
              if (!allowedIds.includes(invoice.userId.toString())) {
                return res.status(403).json({ message: "Access denied" });
              }
            } else {
              return res.status(403).json({ message: "Access denied" });
            }
          } else {
            return res.status(403).json({ message: "Access denied" });
          }
        }
      }

      // 🔹 Handle doctor field - it might be a string (name) or ObjectId
      let doctorName = "-";
      if (invoice.doctor) {
        if (typeof invoice.doctor === "string") {
          // If it's already a string (name), use it directly
          doctorName = invoice.doctor;
        } else if (mongoose.Types.ObjectId.isValid(invoice.doctor)) {
          // If it's an ObjectId, try to populate
          try {
            const doctor = await User.findById(invoice.doctor)
              .select("name role")
              .lean();
            if (doctor && doctor.role === "doctorStaff") {
              doctorName = doctor.name || "-";
            }
          } catch (populateError) {
            // If populate fails, just use the string value or default
            console.error("Error populating doctor:", populateError);
            doctorName = "-";
          }
        }
      }

      const invoiceWithDoctor = {
        ...invoice,
        doctor: doctorName,
        _id: invoice._id.toString(),
        userId: invoice.userId?.toString(),
        invoicedDate: invoice.invoicedDate?.toISOString(),
        createdAt: invoice.createdAt?.toISOString(),
        updatedAt: invoice.updatedAt?.toISOString(),
        advanceClaimReleaseDate: invoice.advanceClaimReleaseDate?.toISOString(),
      };

      return res.status(200).json(invoiceWithDoctor);
    }

    // -------------------------------
    // PUT: Update Payment OR Advance Claim
    // -------------------------------
    if (req.method === "PUT") {
      // Authenticate user
      let user;
      try {
        user = await getAuthorizedStaffUser(req);
      } catch (err) {
        return res
          .status(err.status || 401)
          .json({ success: false, message: err.message });
      }

      // Check if user has permission
      if (
        !hasRole(user, [
          "clinic",
          "staff",
          "admin",
          "doctor",
          "doctorStaff",
          "agent",
        ])
      ) {
        return res
          .status(403)
          .json({ success: false, message: "Access denied" });
      }

      const { updateType } = req.body; // 'payment' | 'status' | 'advanceClaim' | 'details'
      const invoice = await PatientRegistration.findById(id);
      if (!invoice)
        return res.status(404).json({ message: "Invoice not found" });

      let responseMessage = "";

      // -------------------------------
      // Patient Detail Update
      // -------------------------------
      if (updateType === "details") {
        const {
          invoiceNumber,
          invoicedDate,
          emrNumber,
          firstName,
          lastName,
          gender,
          email,
          mobileNumber,
          referredBy,
          patientType,
          insurance,
          insuranceType,
          advanceGivenAmount,
          coPayPercent,
          notes,
          membership,
          membershipStartDate,
          membershipEndDate,
          membershipId,
          package: pkgToggle,
          packageId,
          memberships: membershipsArray,
          packages: packagesArray,
        } = req.body;

        if (!firstName) {
          return res
            .status(400)
            .json({ message: "Missing required patient fields" });
        }

        if (invoiceNumber) invoice.invoiceNumber = invoiceNumber;
        if (invoicedDate) invoice.invoicedDate = new Date(invoicedDate);
        if (emrNumber !== undefined) invoice.emrNumber = emrNumber;
        invoice.firstName = firstName;
        invoice.lastName = lastName || "";
        if (gender !== undefined) invoice.gender = gender;
        if (email !== undefined) invoice.email = email;
        if (mobileNumber !== undefined) invoice.mobileNumber = mobileNumber;
        invoice.referredBy = referredBy || "";
        invoice.patientType = patientType || invoice.patientType;

        invoice.membership = membership || invoice.membership || "No";
        if (membership === "Yes") {
          if (membershipStartDate)
            invoice.membershipStartDate = new Date(membershipStartDate);
          if (membershipEndDate)
            invoice.membershipEndDate = new Date(membershipEndDate);
          if (membershipId) invoice.membershipId = membershipId;
        } else if (membership === "No") {
          invoice.membership = "No";
          invoice.membershipStartDate = null;
          invoice.membershipEndDate = null;
          invoice.membershipId = null;
        }

        if (pkgToggle === "Yes") {
          invoice.package = "Yes";
          invoice.packageId = packageId || invoice.packageId || null;
          if (req.body.packageTotalPrice !== undefined) invoice.packageTotalPrice = req.body.packageTotalPrice;
          if (req.body.packagePaidAmount !== undefined) invoice.packagePaidAmount = req.body.packagePaidAmount;
          if (req.body.packagePaymentStatus !== undefined) invoice.packagePaymentStatus = req.body.packagePaymentStatus;
          if (req.body.packagePaymentMethod !== undefined) invoice.packagePaymentMethod = req.body.packagePaymentMethod;
        } else if (pkgToggle === "No") {
          invoice.package = "No";
          invoice.packageId = null;
          invoice.packageTotalPrice = 0;
          invoice.packagePaidAmount = 0;
          invoice.packagePaymentStatus = "Unpaid";
          invoice.packagePaymentMethod = "";
        }

        // Handle memberships array - update or remove based on formData
        if (Array.isArray(membershipsArray)) {
          if (membershipsArray.length === 0 && membership === "No") {
            // Clear all memberships when membership is set to No
            invoice.memberships = [];
          } else {
            invoice.memberships = membershipsArray.map((m) => ({
              membershipId: m.membershipId,
              startDate: m.startDate ? new Date(m.startDate) : undefined,
              endDate: m.endDate ? new Date(m.endDate) : undefined,
            }));
          }
        }
        
        // Handle packages array - update or remove based on formData
        if (Array.isArray(packagesArray)) {
          if (packagesArray.length === 0 && pkgToggle === "No") {
            // Clear all packages when package is set to No
            invoice.packages = [];
          } else {
            invoice.packages = packagesArray.map((p) => ({
              packageId: p.packageId,
              packageName: p.packageName,
              packageSoldBy: p.packageSoldBy || user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown',
              assignedDate: p.assignedDate ? new Date(p.assignedDate) : undefined,
              validityInMonths: p.validityInMonths || 0,
              startDate: p.startDate ? new Date(p.startDate) : undefined,
              endDate: p.endDate ? new Date(p.endDate) : undefined,
              totalPrice: p.totalPrice || 0,
              paidAmount: p.paidAmount || 0,
              paymentStatus: p.paymentStatus || "Unpaid",
              paymentMethod: p.paymentMethod || "",
            }));
          }
        }

        invoice.notes = notes || "";

        // Insurance handling
        if (insurance === "Yes") {
          invoice.insurance = "Yes";
          invoice.insuranceType =
            insuranceType || invoice.insuranceType || "Paid";
          invoice.advanceGivenAmount =
            advanceGivenAmount !== undefined
              ? Number(advanceGivenAmount)
              : invoice.advanceGivenAmount;
          invoice.coPayPercent =
            coPayPercent !== undefined
              ? Number(coPayPercent)
              : invoice.coPayPercent;
          if (!invoice.advanceClaimStatus) {
            invoice.advanceClaimStatus = "Pending";
          }
        } else if (insurance === "No") {
          invoice.insurance = "No";
          invoice.insuranceType = "Paid";
          invoice.advanceGivenAmount = 0;
          invoice.coPayPercent = 0;
          invoice.advanceClaimStatus = null;
          invoice.advanceClaimReleaseDate = null;
          invoice.advanceClaimReleasedBy = null;
          invoice.advanceClaimCancellationRemark = null;
        }

        responseMessage = "Patient details updated successfully";
      }

      await invoice.save();

      // -------------------------------
      // Patient Detail Update
      // -------------------------------
      // Note: Execute workflow for the updated patient
      executeWorkflows({
        entity: WORKFLOW_ENTITY_TYPE.PATIENT,
        trigger: WORKFLOW_TRIGGER_TYPE.RECORD_UPDATED,
        patientId: invoice._id?.toString(),
        clinicId: invoice.clinicId?.toString(),
      });
      // Note: Execute workflow for the created patient
      executeWorkflows({
        entity: WORKFLOW_ENTITY_TYPE.PATIENT,
        trigger: WORKFLOW_TRIGGER_TYPE.RECORD_CREATE_OR_UPDATE,
        patientId: invoice._id?.toString(),
        clinicId: invoice.clinicId?.toString(),
      });

      return res.status(200).json({
        message: responseMessage || "Patient details updated successfully",
        updatedInvoice: {
          ...invoice.toObject(),
          _id: invoice._id.toString(),
          userId: invoice.userId?.toString(),
          invoicedDate: invoice.invoicedDate?.toISOString(),
          createdAt: invoice.createdAt?.toISOString(),
          updatedAt: invoice.updatedAt?.toISOString(),
          advanceClaimReleaseDate:
            invoice.advanceClaimReleaseDate?.toISOString(),
        },
      });
    }

    // -------------------------------
    // Method Not Allowed
    // -------------------------------
    res.setHeader("Allow", ["GET", "PUT"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    res.status(500).json({ message: err?.message || "Server error" });
  }
}
