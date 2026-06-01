import dbConnect from "../../../lib/database";
// import dbConnect from '../../../../lib/database';
import { getUserFromReq } from "../lead-ms/auth";
import { getClinicIdFromUser } from "../lead-ms/permissions-helper";
import SOP from "../../../models/SOP";
import Policy from "../../../models/Policy";
import Playbook from "../../../models/Playbook";
import Acknowledgment from "../../../models/Acknowledgment";
import User from "../../../models/Users";

export default async function handler(req, res) {
  await dbConnect();

  let user;
  try { 
    user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!["clinic", "agent", "doctorStaff", "staff", "admin"].includes(user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  let clinicId;
  if (user.role === "admin") {
    clinicId = req.query.clinicId || req.body.clinicId;
  } else {
    const resolved = await getClinicIdFromUser(user);
    clinicId = resolved.clinicId;
    if (resolved.error || !clinicId) {
      return res.status(403).json({ success: false, message: resolved.error || "Unable to determine clinic access" });
    }
  }

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { type } = req.query;

  if (type === "sops") {
    const items = await SOP.find({ clinicId }).sort({ updatedAt: -1 }).lean();
    const agentsTotal = await User.countDocuments({ clinicId, role: "agent" });
    const doctorsTotal = await User.countDocuments({ clinicId, role: "doctorStaff" });
    const ids = items.map(i => i._id);
    const acks = await Acknowledgment.aggregate([
      { $match: { clinicId, documentType: "SOP", status: "Acknowledged", documentId: { $in: ids } } },
      { $group: { _id: { doc: "$documentId", role: "$role" }, count: { $sum: 1 } } }
    ]);
    const ackAgent = {};
    const ackDoctor = {};
    for (const r of acks) {
      const idStr = r._id.doc.toString();
      if (r._id.role === "agent") ackAgent[idStr] = r.count;
      if (r._id.role === "doctorStaff") ackDoctor[idStr] = r.count;
    }
    const normalizeRoles = (rolesArr = []) => {
      const lower = (rolesArr || []).map(r => String(r).toLowerCase());
      const hasAll = lower.some(r => r.includes("all"));
      const set = new Set();
      if (hasAll) { set.add("agent"); set.add("doctorStaff"); return set; }
      for (const r of lower) {
        if (r.includes("agent")) set.add("agent");
        if (r.includes("doctor")) set.add("doctorStaff");
      }
      return set;
    };
    const withPercents = items.map(i => {
      const idStr = i._id.toString();
      const applicable = normalizeRoles(i.applicableRoles || []);
      const pa = applicable.has("agent") && agentsTotal > 0 ? ((ackAgent[idStr] || 0) / agentsTotal) * 100 : 0;
      const pd = applicable.has("doctorStaff") && doctorsTotal > 0 ? ((ackDoctor[idStr] || 0) / doctorsTotal) * 100 : 0;
      const denom =
        (applicable.has("agent") ? agentsTotal : 0) +
        (applicable.has("doctorStaff") ? doctorsTotal : 0);
      const ackCount = (ackAgent[idStr] || 0) + (ackDoctor[idStr] || 0);
      const overall = denom > 0 ? (ackCount / denom) * 100 : (pa || pd);
      return { ...i, ackPercentAgent: pa, ackPercentDoctor: pd, ackOverall: overall };
    });
    return res.status(200).json({ success: true, items: withPercents });
  }
  if (type === "policies") {
    const items = await Policy.find({ clinicId }).sort({ updatedAt: -1 }).lean();
    const agentsTotal = await User.countDocuments({ clinicId, role: "agent" });
    const doctorsTotal = await User.countDocuments({ clinicId, role: "doctorStaff" });
    const ids = items.map(i => i._id);
    const acks = await Acknowledgment.aggregate([
      { $match: { clinicId, documentType: "Policy", status: "Acknowledged", documentId: { $in: ids } } },
      { $group: { _id: { doc: "$documentId", role: "$role" }, count: { $sum: 1 } } }
    ]);
    const ackAgent = {};
    const ackDoctor = {};
    for (const r of acks) {
      const idStr = r._id.doc.toString();
      if (r._id.role === "agent") ackAgent[idStr] = r.count;
      if (r._id.role === "doctorStaff") ackDoctor[idStr] = r.count;
    }
    const inferFromAppliesTo = (appliesTo) => {
      const txt = String(appliesTo || "").toLowerCase();
      const set = new Set();
      if (txt.includes("all")) { set.add("agent"); set.add("doctorStaff"); }
      if (txt.includes("agent")) set.add("agent");
      if (txt.includes("doctor")) set.add("doctorStaff");
      return set;
    };
    const withPercents = items.map(i => {
      const idStr = i._id.toString();
      const applicable = new Set((i.appliesToRoles || []).length ? i.appliesToRoles : Array.from(inferFromAppliesTo(i.appliesTo)));
      const pa = applicable.has("agent") && agentsTotal > 0 ? ((ackAgent[idStr] || 0) / agentsTotal) * 100 : 0;
      const pd = applicable.has("doctorStaff") && doctorsTotal > 0 ? ((ackDoctor[idStr] || 0) / doctorsTotal) * 100 : 0;
      const denom =
        (applicable.has("agent") ? agentsTotal : 0) +
        (applicable.has("doctorStaff") ? doctorsTotal : 0);
      const ackCount = (ackAgent[idStr] || 0) + (ackDoctor[idStr] || 0);
      const overall = denom > 0 ? (ackCount / denom) * 100 : (pa || pd);
      return { ...i, ackPercentAgent: pa, ackPercentDoctor: pd, ackOverall: overall };
    });
    return res.status(200).json({ success: true, items: withPercents });
  }
  if (type === "playbooks") {
    const items = await Playbook.find({ clinicId }).sort({ updatedAt: -1 }).lean();
    return res.status(200).json({ success: true, items });
  }

  const sopCount = await SOP.countDocuments({ clinicId });
  const policyCount = await Policy.countDocuments({ clinicId });
  const playbookCount = await Playbook.countDocuments({ clinicId });

  return res.status(200).json({
    success: true,
    overview: {
      sopCount,
      policyCount,
      playbookCount,
    },
  });
}
