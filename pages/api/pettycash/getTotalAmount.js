// pages/api/pettycash/getTotalAmount.js
import dbConnect from "../../../lib/database"; // adjust path if needed
import PettyCash from "../../../models/PettyCash";
import mongoose from "mongoose";
import { getAuthorizedStaffUser } from "../../../server/staff/authHelpers";

export default async function handler(req, res) {
  await dbConnect();

  try {
    // Require auth and derive staffId
    const user = await getAuthorizedStaffUser(req, {
      allowedRoles: ["staff", "doctorStaff", "doctor", "clinic", "agent", "admin"],
    });
    
    if (!user || !user._id) {
      return res.status(401).json({ success: false, message: "Invalid user" });
    }
    
    const staffId = user._id.toString ? user._id.toString() : String(user._id);
    
    if (!staffId || !mongoose.Types.ObjectId.isValid(staffId)) {
      return res.status(401).json({ success: false, message: "Invalid user ID format" });
    }

    // Accept date as YYYY-MM-DD (client will pass this). If not provided, default to today's date.
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    // normalize to midnight start and next day start
    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);

    // Get cumulative balance up to the end of the current day (all previous days + current day)
    const cumulativeEnd = new Date(end);

    // Get cumulative balance up to the current day
    let staffObjectId;
    try {
      staffObjectId = new mongoose.Types.ObjectId(staffId);
    } catch (idError) {
      // console.error("Invalid staffId format:", staffId, idError);
      return res.status(400).json({ success: false, message: "Invalid staff ID format" });
    }

    const cumulativePipeline = [
      {
        $match: { staffId: staffObjectId },
      },
      {
        $project: {
          // filter allocatedAmounts up to current day
          allocatedUpToCurrentDay: {
            $filter: {
              input: "$allocatedAmounts",
              as: "alloc",
              cond: {
                $lt: ["$$alloc.date", cumulativeEnd],
              },
            },
          },
          // filter expenses up to current day
          expensesUpToCurrentDay: {
            $filter: {
              input: "$expenses",
              as: "exp",
              cond: {
                $lt: ["$$exp.date", cumulativeEnd],
              },
            },
          },
        },
      },
      {
        $addFields: {
          allocatedUpToCurrentDaySum: {
            $cond: [
              { $gt: [{ $size: "$allocatedUpToCurrentDay" }, 0] },
              { $sum: "$allocatedUpToCurrentDay.amount" },
              0,
            ],
          },
          expensesUpToCurrentDaySum: {
            $cond: [
              { $gt: [{ $size: "$expensesUpToCurrentDay" }, 0] },
              { $sum: "$expensesUpToCurrentDay.spentAmount" },
              0,
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          cumulativeAllocated: { $sum: "$allocatedUpToCurrentDaySum" },
          cumulativeSpent: { $sum: "$expensesUpToCurrentDaySum" },
        },
      },
    ];

    const cumulativeResult = await PettyCash.aggregate(cumulativePipeline);
    const cumulativeBalance = cumulativeResult[0] 
      ? Math.max(0, cumulativeResult[0].cumulativeAllocated - cumulativeResult[0].cumulativeSpent)
      : 0;

    // Aggregation: filter allocatedAmounts & expenses to only those entries within [start, end)
    const pipeline = [
      // Only include petty cash documents for this staff user
      {
        $match: { staffId: staffObjectId },
      },
      {
        $project: {
          patientName: 1,
          patientEmail: 1,
          // filter allocatedAmounts for the date
          allocatedForDate: {
            $filter: {
              input: "$allocatedAmounts",
              as: "alloc",
              cond: {
                $and: [
                  { $gte: ["$$alloc.date", start] },
                  { $lt: ["$$alloc.date", end] },
                ],
              },
            },
          },
          // filter expenses for the date
          expensesForDate: {
            $filter: {
              input: "$expenses",
              as: "exp",
              cond: {
                $and: [
                  { $gte: ["$$exp.date", start] },
                  { $lt: ["$$exp.date", end] },
                ],
              },
            },
          },
        },
      },
      // compute per-document sums for that date
      {
        $addFields: {
          allocatedForDateSum: {
            $cond: [
              { $gt: [{ $size: "$allocatedForDate" }, 0] },
              { $sum: "$allocatedForDate.amount" },
              0,
            ],
          },
          expensesForDateSum: {
            $cond: [
              { $gt: [{ $size: "$expensesForDate" }, 0] },
              { $sum: "$expensesForDate.spentAmount" },
              0,
            ],
          },
        },
      },
      // Keep only documents where either allocated or expense exists for the date, optional
      // If you want to include everyone (with zeros), remove the match below
      {
        $match: {
          $or: [
            { allocatedForDateSum: { $gt: 0 } },
            { expensesForDateSum: { $gt: 0 } },
          ],
        },
      },
      // Now group to compute global sums, and push patient breakdown
      {
        $group: {
          _id: null,
          globalAllocated: { $sum: "$allocatedForDateSum" },
          globalSpent: { $sum: "$expensesForDateSum" },
          patients: {
            $push: {
              _id: "$_id",
              patientName: "$patientName",
              patientEmail: "$patientEmail",
              allocatedForDate: "$allocatedForDate",
              expensesForDate: "$expensesForDate",
              allocatedForDateSum: "$allocatedForDateSum",
              expensesForDateSum: "$expensesForDateSum",
              remainingForDate: {
                $subtract: ["$allocatedForDateSum", "$expensesForDateSum"],
              },
            },
          },
        },
      },
      // Project nice shape (without cumulative balance - we'll add it later)
      {
        $project: {
          _id: 0,
          globalAllocated: 1,
          globalSpent: 1,
          patients: 1,
        },
      },
    ];

    const agg = await PettyCash.aggregate(pipeline);

    // Get global cumulative amounts (all staff combined) up to current day
    const globalCumulativePipeline = [
      {
        $project: {
          // filter allocatedAmounts up to current day
          allocatedUpToCurrentDay: {
            $filter: {
              input: "$allocatedAmounts",
              as: "alloc",
              cond: {
                $lt: ["$$alloc.date", cumulativeEnd],
              },
            },
          },
          // filter expenses up to current day
          expensesUpToCurrentDay: {
            $filter: {
              input: "$expenses",
              as: "exp",
              cond: {
                $lt: ["$$exp.date", cumulativeEnd],
              },
            },
          },
        },
      },
      {
        $addFields: {
          allocatedUpToCurrentDaySum: {
            $cond: [
              { $gt: [{ $size: "$allocatedUpToCurrentDay" }, 0] },
              { $sum: "$allocatedUpToCurrentDay.amount" },
              0,
            ],
          },
          expensesUpToCurrentDaySum: {
            $cond: [
              { $gt: [{ $size: "$expensesUpToCurrentDay" }, 0] },
              { $sum: "$expensesUpToCurrentDay.spentAmount" },
              0,
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          globalAllocated: { $sum: "$allocatedUpToCurrentDaySum" },
          globalSpent: { $sum: "$expensesUpToCurrentDaySum" },
        },
      },
      {
        $project: {
          _id: 0,
          globalAllocated: 1,
          globalSpent: 1,
          globalRemaining: { $subtract: ["$globalAllocated", "$globalSpent"] },
        },
      },
    ];

    const globalAgg = await PettyCash.aggregate(globalCumulativePipeline);
    const globalResult = (globalAgg && globalAgg[0]) ? globalAgg[0] : { globalAllocated: 0, globalSpent: 0, globalRemaining: 0 };

    // if no entries for that date, return zeros and empty patient list
    if (!agg || !Array.isArray(agg) || agg.length === 0) {
      return res.status(200).json({
        success: true,
        date: start.toISOString(),
        globalAllocated: 0, // Day-wise allocated (0 for this day)
        globalSpent: 0, // Day-wise spent (0 for this day)
        globalRemaining: globalResult.globalRemaining || 0, // Cumulative remaining balance
        patients: [],
      });
    }

    const result = agg[0];
    // Use the cumulative balance calculated earlier
    const finalRemaining = cumulativeBalance;
    
    return res.status(200).json({
      success: true,
      date: start.toISOString(),
      globalAllocated: result.globalAllocated || 0, // Day-wise allocated
      globalSpent: result.globalSpent || 0, // Day-wise spent
      globalRemaining: finalRemaining, // Cumulative remaining balance
      patients: result.patients || [],
    });
  } catch (err) {
    // .error("global-total error:", err);
    // coconsolensole.error("Error stack:", err.stack);
    // Handle errors from getAuthorizedStaffUser which have a status property
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message || "Authentication error" });
    }
    return res.status(500).json({ 
      success: false, 
      message: err.message || "Server error",
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}
