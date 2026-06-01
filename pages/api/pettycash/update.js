import dbConnect from "../../../lib/database";
import PettyCash from "../../../models/PettyCash";
import User from "../../../models/Users";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // ✅ Authenticate
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const staffId = decoded.userId;

    // Get user to check role
    const user = await User.findById(staffId);
    if (!user) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check permissions for clinic/agent/doctor roles
    if (["clinic", "agent", "doctor", "doctorStaff"].includes(user.role)) {
      try {
        const { getClinicIdFromUser, checkClinicPermission } = await import("../lead-ms/permissions-helper");
        const { clinicId, error: clinicError } = await getClinicIdFromUser(user);
        if (clinicError || !clinicId) {
          return res.status(403).json({ 
            message: clinicError || "Unable to determine clinic access" 
          });
        }

        const { hasPermission, error: permError } = await checkClinicPermission(
          clinicId,
          "clinic_staff_management",
          "update",
          "Add Expense"
        );

        if (!hasPermission) {
          return res.status(403).json({
            message: permError || "You do not have permission to update expenses"
          });
        }
      } catch (permErr) {
        // console.error("Permission check error:", permErr);
        return res.status(500).json({ message: "Error checking permissions" });
      }
    } else if (!["staff", "admin"].includes(user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    // ✅ Extract payload
    const { id, type, data } = req.body;

    if (!id || !type || !data) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const pettyCash = await PettyCash.findById(id);
    if (!pettyCash) {
      return res.status(404).json({ message: "Petty Cash record not found" });
    }

    // Check if staff can only update their own records (admin can update any)
    if (user.role === "staff" && pettyCash.staffId.toString() !== staffId.toString()) {
      return res.status(403).json({ message: "You can only update your own records" });
    }

    // ✅ Allow editing only today
    const today = new Date();
    const recordDate = new Date(pettyCash.createdAt);
    if (today.toDateString() !== recordDate.toDateString()) {
      return res
        .status(400)
        .json({ message: "You can only edit today's records" });
    }

    // ---------- ALLOCATED ----------
    if (type === "allocated") {
      const { newAmount, receipts, note } = data;

      if (newAmount === undefined || newAmount === null) {
        return res.status(400).json({ message: "Allocated amount is required" });
      }

      pettyCash.allocatedAmounts.push({
        amount: newAmount,
        receipts: receipts || [],
        date: new Date(),
      });

      if (note !== undefined) {
        pettyCash.note = note;
      }

      // Update global total amount
      await PettyCash.updateGlobalTotalAmount(newAmount, 'add');

    // ---------- EXPENSE ----------
    } else if (type === "expense") {
      const { expenseId, description, spentAmount, receipts } = data;

      if (!description) {
        return res.status(400).json({ message: "Expense description is required" });
      }

      if (spentAmount === undefined || spentAmount === null) {
        return res.status(400).json({ message: "Expense amount is required" });
      }

      if (expenseId) {
        // 🔹 Update existing expense
        const expense = pettyCash.expenses.id(expenseId);
        if (!expense) {
          return res.status(404).json({ message: "Expense not found in record" });
        }

        // Calculate difference for global update
        const amountDifference = spentAmount - expense.spentAmount;
        if (amountDifference !== 0) {
          await PettyCash.updateGlobalSpentAmount(amountDifference, amountDifference > 0 ? 'add' : 'subtract');
        }

        expense.description = description;
        expense.spentAmount = spentAmount;
        expense.receipts = receipts || [];
        expense.date = new Date();
      } else {
        // 🔹 Add new expense
        pettyCash.expenses.push({
          description,
          spentAmount,
          receipts: receipts || [],
          date: new Date(),
        });

        // Update global spent amount
        await PettyCash.updateGlobalSpentAmount(spentAmount, 'add');
      }
    } else {
      return res.status(400).json({ message: "Invalid type provided" });
    }

    await pettyCash.save();

    res.status(200).json({
      success: true,
      message: "Updated successfully",
      pettyCash,
    });
  } catch (err) {
    // console.error("Error updating petty cash:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
