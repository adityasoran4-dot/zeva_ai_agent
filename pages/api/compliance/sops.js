import dbConnect from "../../../lib/database";
import SOP from "../../../models/SOP";
import Acknowledgment from "../../../models/Acknowledgment";
import User from "../../../models/Users";
import Notification from "../../../models/Notification";
import { emitNotificationToUser } from "../push-notification/socketio";
import { getUserFromReq } from '../lead-ms/auth';
import { getClinicIdFromUser } from '../lead-ms/permissions-helper';

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

  if (req.method === "GET") {
    const { id, q, department, status, risk } = req.query;
    if (id) {
      const item = await SOP.findOne({ _id: id, clinicId }).lean();
      if (!item) return res.status(404).json({ success: false, message: "Not found" });
      const agentsTotal = await User.countDocuments({ clinicId, role: "agent" });
      const doctorsTotal = await User.countDocuments({ clinicId, role: "doctorStaff" });
      const grouped = await Acknowledgment.aggregate([
        { $match: { clinicId, documentType: "SOP", documentId: item._id } },
        { $group: { _id: "$role", count: { $sum: 1 }, acknowledged: { $sum: { $cond: [{ $eq: ["$status", "Acknowledged"] }, 1, 0] } } } }
      ]);
      const roleStats = grouped.reduce((acc, r) => { acc[r._id] = r; return acc; }, {});
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
      const applicable = normalizeRoles(item.applicableRoles || []);
      const denom =
        (applicable.has("agent") ? agentsTotal : 0) +
        (applicable.has("doctorStaff") ? doctorsTotal : 0);
      const ackPercentAgent = applicable.has("agent") && agentsTotal > 0 ? ((roleStats.agent?.acknowledged || 0) / agentsTotal) * 100 : 0;
      const ackPercentDoctor = applicable.has("doctorStaff") && doctorsTotal > 0 ? ((roleStats.doctorStaff?.acknowledged || 0) / doctorsTotal) * 100 : 0;
      const ackOverall = denom > 0 ? (((roleStats.agent?.acknowledged || 0) + (roleStats.doctorStaff?.acknowledged || 0)) / denom) * 100 : (ackPercentAgent || ackPercentDoctor);
      return res.status(200).json({ success: true, item: { ...item, ackPercentAgent, ackPercentDoctor, ackOverall } });
    }
    const query = { clinicId };
    if (q) query.name = { $regex: q, $options: "i" };
    if (department) query.department = department;
    if (status) query.status = status;
    if (risk) query.riskLevel = risk;
    // Role-based visibility: agent/doctorStaff/staff see only SOPs assigned to their role or All Staff
    if (["agent", "doctorStaff", "staff"].includes(user.role)) {
      query.applicableRoles = { $in: [user.role, "All Staff"] };
    }
    const items = await SOP.find(query).sort({ updatedAt: -1 }).lean();
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
    const normalizeRolesList = (rolesArr = []) => {
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
      const applicable = normalizeRolesList(i.applicableRoles || []);
      const pa = applicable.has("agent") && agentsTotal > 0 ? ((ackAgent[idStr] || 0) / agentsTotal) * 100 : 0;
      const pd = applicable.has("doctorStaff") && doctorsTotal > 0 ? ((ackDoctor[idStr] || 0) / doctorsTotal) * 100 : 0;
      const denom =
        (applicable.has("agent") ? agentsTotal : 0) +
        (applicable.has("doctorStaff") ? doctorsTotal : 0);
      const ackCount = (ackAgent[idStr] || 0) + (ackDoctor[idStr] || 0);
      const overall = denom > 0 ? (ackCount / denom) * 100 : (pa || pd);
      return { ...i, ackPercentAgent: pa, ackPercentDoctor: pd, ackOverall: overall };
    });
    return res.status(200).json({ success: true, items: withPercents, summary: { agentsTotal, doctorsTotal } });
  }

  if (req.method === "POST") {
    const { 
      name, 
      department, 
      applicableRoles = [], 
      category, 
      riskLevel, 
      version, 
      status = "Active", 
      documentUrl = "",
      content = "",
      checklist = [],
      attachments = [],
      effectiveDate = null,
      reviewDate = null,
      mandatoryAck = false,
      acknowledgmentDeadline = null
    } = req.body;
    if (!name || !department || !category || !riskLevel || !version) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    // Normalize applicableRoles to allowed keys
    const allowedRoles = ["agent", "doctorStaff"];
    let normalizedRoles = Array.isArray(applicableRoles) ? applicableRoles.map(r => String(r).trim()) : [];
    normalizedRoles = normalizedRoles.map(r => {
      const lower = r.toLowerCase();
      if (lower.includes("all")) return "all";
      if (lower.includes("agent")) return "agent";
      if (lower.includes("doctor")) return "doctorStaff";
      return r;
    });
    const selected = normalizedRoles.includes("all") ? allowedRoles : normalizedRoles.filter(r => allowedRoles.includes(r));
    
    // Create the SOP
    const item = await SOP.create({
      clinicId,
      name,
      department,
      applicableRoles: selected,
      category,
      riskLevel,
      version,
      status,
      documentUrl: String(documentUrl || "").trim(),
      lastUpdated: new Date(),
      content,
      checklist,
      attachments,
      effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
      reviewDate: reviewDate ? new Date(reviewDate) : null,
      mandatoryAck: !!mandatoryAck,
      acknowledgmentDeadline: acknowledgmentDeadline ? new Date(acknowledgmentDeadline) : null,
    });
    
    // Auto-assign acknowledgments to users of selected roles
    try {
      if (Array.isArray(selected) && selected.length) {
        const staffIds = Array.isArray(req.body.staffIds) ? req.body.staffIds.filter(Boolean) : [];
        let users;
        if (staffIds.length) {
          users = await User.find({ clinicId, _id: { $in: staffIds } }).select("_id name role");
        } else {
          const rolesToAssign = new Set(selected);
          users = await User.find({ clinicId, role: { $in: Array.from(rolesToAssign) } }).select("_id name role");
        }
        const assigned = item.effectiveDate || new Date();
        const due = item.reviewDate || null;
        const deadline = item.acknowledgmentDeadline ? new Date(item.acknowledgmentDeadline) : null;
        const now = new Date();
        // Overdue only if current time is AFTER the end of the review/deadline day
        const initialStatus = (() => {
          if (!deadline) return "Pending";
          const eod = new Date(deadline);
          eod.setHours(23, 59, 59, 999);
          return now > eod ? "Overdue" : "Pending";
        })();
        
        const bulkOps = users.map(u => ({
          updateOne: {
            filter: { clinicId, staffId: u._id, documentType: "SOP", documentId: item._id },
            update: {
              $set: {
                clinicId,
                staffId: u._id,
                staffName: u.name,
                role: u.role,
                documentType: "SOP",
                documentId: item._id,
                documentName: name,
                version,
                status: initialStatus,
                assignedDate: assigned,
                dueDate: due,
              }
            },
            upsert: true
          }
        }));
        if (bulkOps.length) {
          await Acknowledgment.bulkWrite(bulkOps, { ordered: false });
          const staffIdList = users.map(u => u._id);
          const getBaseUrl = () => {
            if (process.env.NODE_ENV === "production") {
              return process.env.NEXT_PUBLIC_BASE_URL || "https://zeva360.com";
            }
            return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
          };
          try {
            await fetch(`${getBaseUrl()}/api/push-notification/socketio`).catch(() => {});
          } catch {}
          const ackDocs = await Acknowledgment.find({
            clinicId,
            documentType: "SOP",
            documentId: item._id,
            staffId: { $in: staffIdList }
          }).select("_id staffId").lean();
          const ackMap = ackDocs.reduce((acc, a) => {
            acc[a.staffId.toString()] = a._id;
            return acc;
          }, {});
          const message = `Acknowledgment assigned: SOP "${name}"`;
          for (const u of users) {
            try {
              const notification = await Notification.create({
                user: u._id,
                message,
                type: "acknowledgment",
                relatedAcknowledgment: ackMap[u._id.toString()]
              });
              emitNotificationToUser(u._id, {
                _id: notification._id,
                user: u._id,
                message,
                isRead: false,
                type: "acknowledgment",
                relatedAcknowledgment: ackMap[u._id.toString()],
                createdAt: new Date()
              });
            } catch (nerr) {}
          }
        }
      }
    } catch (ackErr) {
      // Do not fail SOP creation if ack assignment fails
      console.error("SOP ack auto-assign error:", ackErr?.message);
    }
    return res.status(201).json({ success: true, item });
  }

  if (req.method === "PUT") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ success: false, message: "Missing id" });
    const update = { ...req.body, lastUpdated: new Date() };
    if (typeof update.documentUrl === "string") update.documentUrl = update.documentUrl.trim();
    const updated = await SOP.findOneAndUpdate({ _id: id, clinicId }, update, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: "Not found" });
    
    // Ensure acknowledgments exist for applicable roles
    try {
      const updatedRoles = Array.isArray(updated.applicableRoles) ? updated.applicableRoles : [];
      const toAssign = (() => {
        const lower = (updatedRoles || []).map(r => String(r).toLowerCase());
        const hasAll = lower.some(r => r.includes("all"));
        if (hasAll) return new Set(["agent", "doctorStaff"]);
        const set = new Set();
        for (const r of lower) {
          if (r.includes("agent")) set.add("agent");
          if (r.includes("doctor")) set.add("doctorStaff");
        }
        return set;
      })();
      
      if (toAssign.size) {
        const staffIds = Array.isArray(req.body.staffIds) ? req.body.staffIds.filter(Boolean) : [];
        let users;
        if (staffIds.length) {
          users = await User.find({ clinicId, _id: { $in: staffIds } }).select("_id name role");
        } else {
          const rolesToAssign = toAssign;
          users = await User.find({ clinicId, role: { $in: Array.from(rolesToAssign) } }).select("_id name role");
        }
        const assigned = updated.effectiveDate || new Date();
        const due = updated.reviewDate || null;
        const deadline = updated.acknowledgmentDeadline ? new Date(updated.acknowledgmentDeadline) : null;
        const now = new Date();
        
        // FIXED: Status logic - if deadline exists and current time is AFTER deadline → "Overdue", otherwise → "Pending"
        const updatedStatus = deadline && now > deadline ? "Overdue" : "Pending";
        
        const bulkOps = users.map(u => ({
          updateOne: {
            filter: { clinicId, staffId: u._id, documentType: "SOP", documentId: updated._id },
            update: {
              $setOnInsert: {
                clinicId,
                staffId: u._id,
                staffName: u.name,
                role: u.role,
                documentType: "SOP",
                documentId: updated._id,
                documentName: updated.name,
                version: updated.version,
                assignedDate: assigned,
                dueDate: due,
              },
              $set: {
                status: updatedStatus,
              }
            },
            upsert: true
          }
        }));
        if (bulkOps.length) await Acknowledgment.bulkWrite(bulkOps, { ordered: false });
      }
    } catch (ackErr) {
      console.error("SOP ack ensure on update error:", ackErr?.message);
    }
    return res.status(200).json({ success: true, item: updated.toObject() });
  }

  if (req.method === "DELETE") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ success: false, message: "Missing id" });
    await SOP.deleteOne({ _id: id, clinicId });
    await Acknowledgment.deleteMany({ clinicId, documentType: "SOP", documentId: id });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
