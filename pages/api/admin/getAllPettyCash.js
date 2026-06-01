import jwt from "jsonwebtoken";
import dbConnect from "../../../lib/database";
import User from "../../../models/Users";
import PettyCash from "../../../models/PettyCash";
import { getUserFromReq } from "../lead-ms/auth";
import { checkAgentPermission } from "../agent/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET")
    return res.status(405).json({ message: "Method Not Allowed" });

  try {
    // Get the logged-in user
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ message: "Unauthorized: Missing or invalid token" });
    }
    
    // Check permissions for agents - admins bypass all checks
    if (me.role === 'agent' || me.role === 'doctorStaff') {
      const { hasPermission } = await checkAgentPermission(me._id, "admin_staff_management", "read", "Track Expenses");
      if (!hasPermission) {
        return res.status(403).json({ 
          message: "Permission denied: You do not have read permission for Track Expenses submodule" 
        });
      }
    } else if (me.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin or agent role required" });
    }

    const { staffName, startDate, endDate } = req.query;

    // Fetch all staff for dropdown
    const staffUsers = await User.find({ role: { $in: ["staff", "doctorStaff"] } }).select("name");

    // Find staffId if staffName is selected
    let staffIdFilter;
    if (staffName) {
      const staff = staffUsers.find(
        (s) => s.name.toLowerCase() === staffName.toLowerCase()
      );
      staffIdFilter = staff ? staff._id : null;
    }

    // Build date range filter
    let start, end;
if (startDate && !endDate) {
  // only startDate provided → same day filter
  start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  end = new Date(startDate);
  end.setHours(23, 59, 59, 999);
} else if (!startDate && endDate) {
  // only endDate provided → same day filter
  start = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
} else {
  // both provided or both empty
  start = startDate ? new Date(startDate) : new Date();
  start.setHours(0, 0, 0, 0);
  end = endDate ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999);
}


    // Query PettyCash: fetch only records having allocatedAmounts OR expenses in the date range
    const query = {
      ...(staffIdFilter && { staffId: staffIdFilter }),
      $or: [
        { "allocatedAmounts.date": { $gte: start, $lte: end } },
        { "expenses.date": { $gte: start, $lte: end } },
      ],
    };

    const records = await PettyCash.find(query)
      .populate("staffId", "name email")
      .sort({ createdAt: -1 });

    // Get cumulative balance up to the end of the current day (all previous days + current day)
    const cumulativeEnd = new Date(end);

    // Calculate cumulative balance up to current day
    const cumulativeQuery = {
      ...(staffIdFilter && { staffId: staffIdFilter }),
      $or: [
        { "allocatedAmounts.date": { $lt: cumulativeEnd } },
        { "expenses.date": { $lt: cumulativeEnd } },
      ],
    };

    const cumulativeRecords = await PettyCash.find(cumulativeQuery);
    let cumulativeAllocated = 0;
    let cumulativeSpent = 0;

    cumulativeRecords.forEach((record) => {
      const cumulativeAllocatedFiltered = record.allocatedAmounts.filter(
        (a) => new Date(a.date) < cumulativeEnd
      );
      const cumulativeExpensesFiltered = record.expenses.filter(
        (e) => new Date(e.date) < cumulativeEnd
      );

      cumulativeAllocated += cumulativeAllocatedFiltered.reduce((sum, a) => sum + a.amount, 0);
      cumulativeSpent += cumulativeExpensesFiltered.reduce((sum, e) => sum + e.spentAmount, 0);
    });

    const cumulativeBalance = Math.max(0, cumulativeAllocated - cumulativeSpent);

    // Group by staff
    const groupedData = {};
    records.forEach((record) => {
      // Filter allocated and expenses by date
      const allocatedFiltered = record.allocatedAmounts.filter(
        (a) => new Date(a.date) >= start && new Date(a.date) <= end
      );
      const expensesFiltered = record.expenses.filter(
        (e) => new Date(e.date) >= start && new Date(e.date) <= end
      );

      if (allocatedFiltered.length === 0 && expensesFiltered.length === 0) return;

      const staffId = record.staffId._id;
      if (!groupedData[staffId]) {
        groupedData[staffId] = {
          staff: record.staffId,
          patients: [],
          expenses: [],
          totalAllocated: 0,
          totalSpent: 0,
          totalAmount: 0,
        };
      }

      // Add patient info
      groupedData[staffId].patients.push({
        name: record.patientName,
        email: record.patientEmail,
        phone: record.patientPhone,
        allocatedAmounts: allocatedFiltered,
      });

      // Add expenses
      groupedData[staffId].expenses.push(...expensesFiltered);

      // Update day-wise totals for display
      groupedData[staffId].totalAllocated += allocatedFiltered.reduce(
        (sum, a) => sum + a.amount,
        0
      );
      groupedData[staffId].totalSpent += expensesFiltered.reduce(
        (sum, e) => sum + e.spentAmount,
        0
      );
    });

    // Calculate cumulative balance for each staff member and update totals
    Object.keys(groupedData).forEach(staffId => {
      const staffCumulativeRecords = cumulativeRecords.filter(record => 
        record.staffId && record.staffId.toString() === staffId.toString()
      );
      let staffCumulativeAllocated = 0;
      let staffCumulativeSpent = 0;
      
      staffCumulativeRecords.forEach((record) => {
        const cumulativeAllocatedFiltered = record.allocatedAmounts.filter(
          (a) => new Date(a.date) < cumulativeEnd
        );
        const cumulativeExpensesFiltered = record.expenses.filter(
          (e) => new Date(e.date) < cumulativeEnd
        );

        staffCumulativeAllocated += cumulativeAllocatedFiltered.reduce((sum, a) => sum + a.amount, 0);
        staffCumulativeSpent += cumulativeExpensesFiltered.reduce((sum, e) => sum + e.spentAmount, 0);
      });
      
      const staffCumulativeBalance = Math.max(0, staffCumulativeAllocated - staffCumulativeSpent);
      
      groupedData[staffId].totalAmount = staffCumulativeBalance;
    });

    const finalData = Object.values(groupedData);

    // Calculate day-wise allocated and spent amounts for display
    let dayWiseAllocated = 0;
    let dayWiseSpent = 0;
    finalData.forEach((item) => {
      // Calculate day-wise amounts for each staff member
      const staffDayWiseAllocated = item.patients.reduce((sum, patient) => {
        return sum + patient.allocatedAmounts.reduce((patientSum, alloc) => {
          const allocDate = new Date(alloc.date);
          return (allocDate >= start && allocDate <= end) ? patientSum + alloc.amount : patientSum;
        }, 0);
      }, 0);
      
      const staffDayWiseSpent = item.expenses.reduce((sum, expense) => {
        const expenseDate = new Date(expense.date);
        return (expenseDate >= start && expenseDate <= end) ? sum + expense.spentAmount : sum;
      }, 0);
      
      dayWiseAllocated += staffDayWiseAllocated;
      dayWiseSpent += staffDayWiseSpent;
    });

    // Use day-wise amounts for allocated/spent, but cumulative for remaining
    const globalAmounts = {
      globalTotalAmount: dayWiseAllocated, // Day-wise allocated
      globalSpentAmount: dayWiseSpent, // Day-wise spent
      globalRemainingAmount: cumulativeBalance // Cumulative remaining
    };

    return res.status(200).json({
      success: true,
      data: finalData,
      staffList: staffUsers.map((s) => s.name),
      globalAmounts: globalAmounts,
    });
  } catch (error) {
    // console.error("Error fetching petty cash:", error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
}
