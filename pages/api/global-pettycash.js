import dbConnect from "../../lib/database";
import jwt from "jsonwebtoken";
import User from "../../models/Users";
import PettyCash from "../../models/PettyCash";

// Helper: verify JWT and get user
async function getUserFromToken(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.split(" ")[1];
  if (!token) throw { status: 401, message: "No token provided" };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) throw { status: 401, message: "User not found" };
    return user;
  } catch (err) {
    throw { status: 401, message: "Invalid or expired token" };
  }
}

export default async function handler(req, res) {
  await dbConnect();

  try {
    const user = await getUserFromToken(req);
    
    // Check if user has permission to access global petty cash
    if (!["staff", "admin", "clinic", "super admin"].includes(user.role.toLowerCase())) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied" 
      });
    }

    if (req.method === "GET") {
      // Get current global amounts
      const globalAmounts = await PettyCash.getGlobalAmounts();
      
      // Get summary statistics
      const pipeline = [
        {
          $group: {
            _id: null,
            totalAllocated: { $sum: "$totalAllocated" },
            totalSpent: { $sum: "$totalSpent" },
            totalRecords: { $sum: 1 },
            totalStaff: { $addToSet: "$staffId" }
          }
        }
      ];
      
      const result = await PettyCash.aggregate(pipeline);
      const stats = result[0] || { 
        totalAllocated: 0, 
        totalSpent: 0, 
        totalRecords: 0,
        totalStaff: []
      };

      return res.status(200).json({
        success: true,
        data: {
          globalTotalAmount: globalAmounts.globalTotalAmount,
          globalSpentAmount: globalAmounts.globalSpentAmount,
          globalRemainingAmount: globalAmounts.globalRemainingAmount,
          totalAllocated: stats.totalAllocated,
          totalSpent: stats.totalSpent,
          totalRecords: stats.totalRecords,
          totalStaff: stats.totalStaff.length,
          lastUpdated: new Date()
        }
      });
    }

    if (req.method === "POST") {
      // Update global amounts (admin only)
      if (!["admin", "super admin"].includes(user.role.toLowerCase())) {
        return res.status(403).json({ 
          success: false, 
          message: "Admin privileges required" 
        });
      }

      const { action, amount } = req.body;
      
      if (!action || !amount || amount <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Valid action and amount required" 
        });
      }

      // Recalculate global amounts from all records
      const globalAmounts = await PettyCash.recalculateGlobalAmounts();
      
      return res.status(200).json({
        success: true,
        message: "Global amounts updated successfully",
        data: {
          globalTotalAmount: globalAmounts.globalTotalAmount,
          globalSpentAmount: globalAmounts.globalSpentAmount,
          globalRemainingAmount: globalAmounts.globalRemainingAmount,
          action: action,
          amount: amount
        }
      });
    }

    return res.status(405).json({ 
      success: false, 
      message: "Method not allowed" 
    });

  } catch (error) {
    console.error("Error in global petty cash API:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
}
