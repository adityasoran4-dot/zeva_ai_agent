import dbConnect from "../../lib/database";
import WorkSession from "../../models/WorkSession";
import User from "../../models/Users";
import Clinic from "../../models/Clinic";
import { getUserFromReq, requireRole } from "./lead-ms/auth";
import { getClinicIdFromUser } from "./lead-ms/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const me = await getUserFromReq(req);
  if (!requireRole(me, ["admin", "clinic", "agent", "doctor", "doctorStaff"])) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const role = (req.query.role || "").toString();
  const filter = (req.query.filter || "all").toString();
  const limit = parseInt(req.query.limit || "0", 10);

  if (!["agent", "doctor"].includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid role" });
  }

  let clinicId = null;
  if (me.role === "admin") {
    const qClinicId = req.query.clinicId;
    if (qClinicId) {
      const clinic = await Clinic.findById(qClinicId).select("_id");
      if (!clinic) {
        return res.status(404).json({ success: false, message: "Clinic not found" });
      }
      clinicId = clinic._id;
    }
  } else {
    const resolved = await getClinicIdFromUser(me);
    if (resolved.error && !resolved.isAdmin) {
      return res.status(404).json({ success: false, message: resolved.error });
    }
    clinicId = resolved.clinicId || null;
  }

  let userQuery = {};
  if (role === "agent") {
    userQuery = { role: "agent", declined: false, isApproved: true };
    if (clinicId) userQuery.clinicId = clinicId;
    if (!clinicId && me.role === "clinic") {
      const clinic = await Clinic.findOne({ owner: me._id }).select("_id");
      if (!clinic) {
        return res.status(404).json({ success: false, message: "Clinic not found for this user" });
      }
      userQuery.clinicId = clinic._id;
    }
  } else {
    userQuery = { role: "doctorStaff", declined: false, isApproved: true };
    if (clinicId) {
      userQuery.$or = [{ clinicId }, { createdBy: me._id }];
    } else if (me.role === "clinic") {
      userQuery.createdBy = me._id;
    }
  }

  const users = await User.find(userQuery).select("_id name email clinicId createdBy role").lean();

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const results = [];
  for (const u of users) {
    let sessionQuery = { date: { $gte: start, $lte: end } };
    if (role === "agent") {
      sessionQuery.role = "agent";
      sessionQuery.$or = [{ agentId: u._id }, { userId: u._id }];
    } else {
      sessionQuery.role = { $in: ["doctor", "doctorStaff"] };
      sessionQuery.$or = [{ doctorId: u._id }, { userId: u._id }];
    }
    const session = await WorkSession.findOne(sessionQuery).select("productivityPercentage").lean();
    const pct = session?.productivityPercentage ?? 0;
    results.push({ ...u, productivityPercentage: pct });
  }

  let sorted = results;
  if (filter === "mostProductive") {
    sorted = results.sort((a, b) => (b.productivityPercentage || 0) - (a.productivityPercentage || 0));
  } else if (filter === "leastProductive") {
    sorted = results.sort((a, b) => (a.productivityPercentage || 0) - (b.productivityPercentage || 0));
  }

  if (limit && limit > 0) {
    sorted = sorted.slice(0, limit);
  }

  return res.status(200).json({
    success: true,
    role,
    filter,
    count: sorted.length,
    data: sorted,
  });
}
