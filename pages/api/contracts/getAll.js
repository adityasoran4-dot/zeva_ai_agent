// /pages/api/contracts/getAll.js
import dbConnect from "../../../lib/database";
import Contract from "../../../models/Contract";
import User from "../../../models/Users";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "Token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(403).json({ success: false, message: "Invalid token" });
    }

    // ✅ If admin -> fetch all contracts
    const query = {};

    const contracts = await Contract.find(query)
      .populate("responsiblePerson", "name email role") // populate name/email
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: contracts.length,
      data: contracts,
    });
  } catch (error) {
    console.error("Error fetching contracts:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
}
