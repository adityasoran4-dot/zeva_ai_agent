import jwt from "jsonwebtoken";
import dbConnect from "../../../lib/database";
import PettyCash from "../../../models/PettyCash";
import User from "../../../models/Users";
import Supplier from "../../../models/stocks/Supplier";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { 
      description, 
      spentAmount, 
      vendor, 
      vendorName, 
      items, 
      receipts, 
      usedFromPettyCash 
    } = req.body;

    // Validate required fields
    if (!description || spentAmount === undefined || spentAmount === "") {
      return res.status(400).json({ message: "Description and spentAmount are required" });
    }

    // Verify JWT
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token missing or invalid" });
    }
    const token = authHeader.split(" ")[1];

    let staffId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      staffId = decoded.userId;
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const staffUser = await User.findById(staffId);
    if (!staffUser) {
      return res.status(403).json({ message: "User not found" });
    }

    // Check permissions for clinic roles
    if (["clinic", "agent", "doctor", "doctorStaff"].includes(staffUser.role)) {
      try {
        const { getClinicIdFromUser, checkClinicPermission } = await import("../lead-ms/permissions-helper");
        const { clinicId, error: clinicError } = await getClinicIdFromUser(staffUser);
        if (clinicError || !clinicId) {
          return res.status(403).json({ 
            message: clinicError || "Unable to determine clinic access" 
          });
        }

        // Optional: Check specific permission if needed
        // const { hasPermission } = await checkClinicPermission(clinicId, "clinic_staff_management", "create", "Add Expense");
        // if (!hasPermission) return res.status(403).json({ message: "No permission to add expense" });
      } catch (permErr) {
        // console.error("Permission check error:", permErr);
      }
    } else if (staffUser.role !== "staff" && staffUser.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Get or Create a global record for expenses if not specified, 
    // or just create a new record for this specific expense.
    // The requirement says "store all fields into model/pettycash in ExpenseSchema".
    // Usually expenses are added to a PettyCash record.
    
    // Get clinicId for global tracking
    let clinicId;
    try {
      const { getClinicIdFromUser } = await import("../lead-ms/permissions-helper");
      const { clinicId: cid } = await getClinicIdFromUser(staffUser);
      clinicId = cid;
    } catch (err) {
      // console.error("Error getting clinicId:", err);
    }

    // Find an existing PettyCash record for this staff or create a new one
    let pettyCash = await PettyCash.findOne({ staffId }).sort({ createdAt: -1 });
    
    if (!pettyCash) {
      pettyCash = await PettyCash.create({
        staffId,
        clinicId,
        note: "Petty Cash Record",
        allocatedAmounts: [],
        expenses: [],
      });
    } else if (!pettyCash.clinicId && clinicId) {
      // Update existing record with clinicId if missing
      pettyCash.clinicId = clinicId;
    }

    // Add to expenses array
    pettyCash.expenses.push({
      description,
      spentAmount: Number(spentAmount),
      vendor: vendor || null,
      vendorName: vendorName || null,
      items: items || [],
      receipts: receipts || [],
      usedFromPettyCash: usedFromPettyCash !== undefined ? usedFromPettyCash : true,
      date: new Date(),
    });

    await pettyCash.save();

    // If usedFromPettyCash is true, deduct from global spent amount
    if (usedFromPettyCash !== false && clinicId) {
      await PettyCash.updateGlobalSpentAmount(clinicId, Number(spentAmount), 'add');
    }

    res.status(201).json({
      success: true,
      message: "Expense added successfully",
      data: pettyCash,
    });
  } catch (error) {
    // console.error("Error adding expense:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
}
