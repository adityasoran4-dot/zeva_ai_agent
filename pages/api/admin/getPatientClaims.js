// /pages/api/admin/getPatientClaims.js

import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import dbConnect from "../../../lib/database";
import User from "../../../models/Users";
import PatientRegistration from "../../../models/PatientRegistration";
import { getUserFromReq } from "../lead-ms/auth";
import { checkAgentPermission } from "../agent/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  } 

  try {
    // Get the logged-in user
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ message: "Unauthorized: Missing or invalid token" });
    }
    
    // Check permissions for agents - admins bypass all checks
    if (me.role === 'agent' || me.role === 'doctorStaff') {
      const { hasPermission } = await checkAgentPermission(me._id, "admin_staff_management", "read", "Patient Report");
      if (!hasPermission) {
        return res.status(403).json({ 
          message: "Permission denied: You do not have read permission for Patient Report submodule" 
        });
      }
    } else if (me.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin or agent role required" });
    }

    const { statusFilter } = req.query;

    // 🔹 Build query based on filter
    const query = {};
    if (statusFilter) {
      if (statusFilter.toLowerCase() === "co-pay") {
        query.coPayPercent = { $gt: 0 };
      } else if (statusFilter.toLowerCase() === "advance") {
        query.advanceGivenAmount = { $gt: 0 };
      } else {
        query.advanceClaimStatus = new RegExp(`^${statusFilter}$`, "i");
      }
    }

    // 🔹 Fetch patients
    // First fetch without populate to avoid errors with invalid ObjectIds
    const patientsRaw = await PatientRegistration.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Helper function to check if a value is a valid ObjectId
    const isValidObjectId = (id) => {
      if (!id) return false;
      if (typeof id === 'string') {
        return /^[0-9a-fA-F]{24}$/.test(id);
      }
      return id instanceof mongoose.Types.ObjectId;
    };

    // Manually populate userId for valid ObjectIds only
    const patients = await Promise.all(
      patientsRaw.map(async (p) => {
        const patient = { ...p };
        
        // Populate userId only if it's a valid ObjectId
        if (isValidObjectId(p.userId)) {
          try {
            const user = await User.findById(p.userId).select("name").lean();
            patient.userId = user ? { _id: user._id, name: user.name } : null;
          } catch (err) {
            // console.error(`Error populating userId for patient ${p._id}:`, err);
            patient.userId = null;
          }
        } else {
          // If userId is not a valid ObjectId, set it to null or keep the string value
          patient.userId = typeof p.userId === 'string' ? { name: p.userId } : null;
        }

        // Populate doctor if it's a valid ObjectId and matches doctorStaff role
        if (isValidObjectId(p.doctor)) {
          try {
            const doctor = await User.findOne({ _id: p.doctor, role: "doctorStaff" })
              .select("name role")
              .lean();
            patient.doctor = doctor ? { _id: doctor._id, name: doctor.name, role: doctor.role } : null;
          } catch (err) {
            // console.error(`Error populating doctor for patient ${p._id}:`, err);
            patient.doctor = null;
          }
        } else {
          // If doctor is a string (name), keep it as is
          patient.doctor = typeof p.doctor === 'string' ? { name: p.doctor } : null;
        }

        return patient;
      })
    );

    // 🔹 Count summary
    const allPatients = await PatientRegistration.find({});
    const summary = {
      pending: allPatients.filter((p) => p.advanceClaimStatus === "Pending").length,
      released: allPatients.filter((p) => p.advanceClaimStatus === "Released").length,
      cancelled: allPatients.filter((p) => p.advanceClaimStatus === "Cancelled").length,
      copay: allPatients.filter((p) => p.coPayPercent > 0).length,
      advance: allPatients.filter((p) => p.advanceGivenAmount > 0).length,
      total: allPatients.length,
    };

    // 🔹 Map patient details
    const patientDetails = patients.map((p) => ({
      _id: p._id,
      invoiceNumber: p.invoiceNumber || "-",
      invoicedBy: p.invoicedBy || "-",
      userId: p.userId || null, // staff unchanged
      emrNumber: p.emrNumber || "-",
      firstName: p.firstName || "-",
      lastName: p.lastName || "-",
      gender: p.gender || "-",
      email: p.email || "-",
      mobileNumber: p.mobileNumber || "-",
      referredBy: p.referredBy || "-",
      patientType: p.patientType || "-",
      doctor: p.doctor ? p.doctor.name : "-", // ✅ doctorStaff name
      service: p.service || "-",
      treatment: p.treatment || "-",
      package: p.package || "-",
      amount: p.amount || 0,
      paid: p.paid || 0,
      advance: p.advance || 0,
      pending: p.pending || 0,
      paymentMethod: p.paymentMethod || "-",
      paymentHistory: p.paymentHistory || [],
      insurance: p.insurance || "No",
      advanceGivenAmount: p.advanceGivenAmount || 0,
      coPayPercent: p.coPayPercent || 0,
      needToPay: p.needToPay || 0,
      advanceClaimStatus: p.advanceClaimStatus || "-",
      advanceClaimReleasedBy: p.advanceClaimReleasedBy || null,
      status: p.status || "-",
      invoicedDate: p.invoicedDate || "-",
      createdAt: p.createdAt || "-",
      updatedAt: p.updatedAt || "-",
      __v: p.__v || 0,
    }));

    return res.status(200).json({
      message: "Patient claims fetched successfully",
      summary,
      patients: patientDetails,
    });
  } catch (error) {
    // console.error("Admin Patient Claim Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
