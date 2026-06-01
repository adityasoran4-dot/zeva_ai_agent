import dbConnect from "../../../../lib/database";
import Appointment from "../../../../models/Appointment";
import Room from "../../../../models/Room";
import Billing from "../../../../models/Billing";
import { getUserFromReq } from "../../lead-ms/auth";
import { getClinicIdFromUser, checkClinicPermission } from "../../lead-ms/permissions-helper";
import mongoose from "mongoose";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    await dbConnect();
  } catch {
    return res.status(500).json({ success: false, message: "Database connection failed" });
  }

  let me;
  try {
    me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  const { clinicId, error: clinicError } = await getClinicIdFromUser(me);
  if (clinicError && me.role !== "admin") {
    return res.status(403).json({ success: false, message: clinicError });
  }

  const { hasPermission } = await checkClinicPermission(clinicId, "clinic_reporting", "read");
  if (!hasPermission) {
    return res.status(403).json({ success: false, message: "You do not have permission to view reports" });
  }

  const { startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const end = endDate ? new Date(endDate) : new Date();
  const startAt = new Date(start);
  startAt.setHours(0, 0, 0, 0);
  const endAt = new Date(end);
  endAt.setHours(23, 59, 59, 999);

  try {
    const match = {
      ...(clinicId ? { clinicId: new mongoose.Types.ObjectId(String(clinicId)) } : {}),
      startDate: { $gte: startAt, $lte: endAt },
    };

    const agg = await Appointment.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$roomId",
          totalBookings: { $sum: 1 },
        },
      },
      { $sort: { totalBookings: -1 } },
    ]);

    // Revenue Aggregation
    const billingMatch = {
      ...(clinicId ? { clinicId: new mongoose.Types.ObjectId(String(clinicId)) } : {}),
      invoicedDate: { $gte: startAt, $lte: endAt },
    };

    const revenueAgg = await Billing.aggregate([
      { $match: billingMatch },
      {
        $lookup: {
          from: "appointments",
          localField: "appointmentId",
          foreignField: "_id",
          as: "appt",
        },
      },
      { $unwind: { path: "$appt", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$appt.roomId",
          totalRevenue: { $sum: { $ifNull: ["$paid", 0] } },
        },
      },
    ]);

    const revenueByRoom = new Map(revenueAgg.map((r) => [String(r._id), r.totalRevenue]));

    const roomIdsSet = new Set([
      ...agg.map((r) => String(r._id || "")),
      ...revenueAgg.map((r) => String(r._id || "")),
    ]);
    const roomIds = Array.from(roomIdsSet).filter((id) => id && id !== "null");

    let roomsById = new Map();
    if (roomIds.length) {
      const roomsFound = await Room.find({ _id: { $in: roomIds } })
        .select("_id name")
        .lean();
      roomsById = new Map(roomsFound.map((r) => [String(r._id), r.name || "Unknown"]));
    }

    const rooms = roomIds.map((id) => {
      const bookings = agg.find((a) => String(a._id) === id)?.totalBookings || 0;
      const revenue = revenueByRoom.get(id) || 0;
      return {
        roomId: id,
        roomName: roomsById.get(id) || "Unknown",
        totalBookings: bookings,
        totalRevenue: revenue,
      };
    });

    const top5Rooms = [...rooms].sort((a, b) => b.totalBookings - a.totalBookings).slice(0, 5);
    const topRevenueRooms = [...rooms].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10);

    return res.status(200).json({
      success: true,
      data: {
        rooms,
        top5Rooms,
        topRevenueRooms,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to load room resource report" });
  }
}
