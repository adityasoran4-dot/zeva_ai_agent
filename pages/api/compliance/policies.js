//api/policies.js
// import dbConnect from "../../../lib/database";
// import Policy from "../../../models/Policy";
// import Acknowledgment from "../../../models/Acknowledgment";
// import User from "../../../models/Users";
// import { getUserFromReq } from "../lead-ms/auth";
// import { getClinicIdFromUser } from "../lead-ms/permissions-helper";

// export default async function handler(req, res) {
//   await dbConnect();


//   let user;
//   try {
//     user = await getUserFromReq(req);
//     if (!user) {
//       return res.status(401).json({ success: false, message: "Unauthorized" });
//     }
//     if (!["clinic", "agent", "doctorStaff", "staff", "admin"].includes(user.role)) {
//       return res.status(403).json({ success: false, message: "Access denied" });
//     }
//   } catch {
//     return res.status(401).json({ success: false, message: "Invalid token" });
//   }

//   let clinicId;
//   if (user.role === "admin") {
//     clinicId = req.query.clinicId || req.body.clinicId;
//   } else {
//     const resolved = await getClinicIdFromUser(user);
//     clinicId = resolved.clinicId;
//     if (resolved.error || !clinicId) {
//       return res.status(403).json({ success: false, message: resolved.error || "Unable to determine clinic access" });
//     }
//   }

//   if (req.method === "GET") {
//     const { id, q, type, status } = req.query;
//     if (id) {
//       const item = await Policy.findOne({ _id: id, clinicId }).lean();
//       if (!item) return res.status(404).json({ success: false, message: "Not found" });
//       const agentsTotal = await User.countDocuments({ clinicId, role: "agent" });
//       const doctorsTotal = await User.countDocuments({ clinicId, role: "doctorStaff" });
//       const grouped = await Acknowledgment.aggregate([
//         { $match: { clinicId, documentType: "Policy", documentId: item._id } },
//         { $group: { _id: "$role", count: { $sum: 1 }, acknowledged: { $sum: { $cond: [{ $eq: ["$status", "Acknowledged"] }, 1, 0] } } } }
//       ]);
//       const roleStats = grouped.reduce((acc, r) => { acc[r._id] = r; return acc; }, {});
//       const inferFromAppliesTo = (appliesTo) => {
//         const txt = String(appliesTo || "").toLowerCase();
//         const set = new Set();
//         if (txt.includes("all")) { set.add("agent"); set.add("doctorStaff"); }
//         if (txt.includes("agent")) set.add("agent");
//         if (txt.includes("doctor")) set.add("doctorStaff");
//         return set;
//       };
//       const applicable = new Set((item.appliesToRoles || []).length ? item.appliesToRoles : Array.from(inferFromAppliesTo(item.appliesTo)));
//       const denom =
//         (applicable.has("agent") ? agentsTotal : 0) +
//         (applicable.has("doctorStaff") ? doctorsTotal : 0);
//       const ackPercentAgent = applicable.has("agent") && agentsTotal > 0 ? ((roleStats.agent?.acknowledged || 0) / agentsTotal) * 100 : 0;
//       const ackPercentDoctor = applicable.has("doctorStaff") && doctorsTotal > 0 ? ((roleStats.doctorStaff?.acknowledged || 0) / doctorsTotal) * 100 : 0;
//       const ackOverall = denom > 0 ? (((roleStats.agent?.acknowledged || 0) + (roleStats.doctorStaff?.acknowledged || 0)) / denom) * 100 : (ackPercentAgent || ackPercentDoctor);
//       return res.status(200).json({ success: true, item: { ...item, ackPercentAgent, ackPercentDoctor, ackOverall } });
//     }
//     const query = { clinicId };
//     if (q) query.name = { $regex: q, $options: "i" };
//     if (type) query.policyType = type;
//     if (status) query.status = status;
//     const items = await Policy.find(query).sort({ updatedAt: -1 }).lean();
//     const agentsTotal = await User.countDocuments({ clinicId, role: "agent" });
//     const doctorsTotal = await User.countDocuments({ clinicId, role: "doctorStaff" });
//     const ids = items.map(i => i._id);
//     const acks = await Acknowledgment.aggregate([
//       { $match: { clinicId, documentType: "Policy", status: "Acknowledged", documentId: { $in: ids } } },
//       { $group: { _id: { doc: "$documentId", role: "$role" }, count: { $sum: 1 } } }
//     ]);
//     const ackAgent = {};
//     const ackDoctor = {};
//     for (const r of acks) {
//       const idStr = r._id.doc.toString();
//       if (r._id.role === "agent") ackAgent[idStr] = r.count;
//       if (r._id.role === "doctorStaff") ackDoctor[idStr] = r.count;
//     }
//     const inferFromAppliesToList = (appliesTo) => {
//       const txt = String(appliesTo || "").toLowerCase();
//       const set = new Set();
//       if (txt.includes("all")) { set.add("agent"); set.add("doctorStaff"); }
//       if (txt.includes("agent")) set.add("agent");
//       if (txt.includes("doctor")) set.add("doctorStaff");
//       return set;
//     };
//     const withPercents = items.map(i => {
//       const idStr = i._id.toString();
//       const applicable = new Set((i.appliesToRoles || []).length ? i.appliesToRoles : Array.from(inferFromAppliesToList(i.appliesTo)));
//       const pa = applicable.has("agent") && agentsTotal > 0 ? ((ackAgent[idStr] || 0) / agentsTotal) * 100 : 0;
//       const pd = applicable.has("doctorStaff") && doctorsTotal > 0 ? ((ackDoctor[idStr] || 0) / doctorsTotal) * 100 : 0;
//       const denom =
//         (applicable.has("agent") ? agentsTotal : 0) +
//         (applicable.has("doctorStaff") ? doctorsTotal : 0);
//       const ackCount = (ackAgent[idStr] || 0) + (ackDoctor[idStr] || 0);
//       const overall = denom > 0 ? (ackCount / denom) * 100 : (pa || pd);
//       return { ...i, ackPercentAgent: pa, ackPercentDoctor: pd, ackOverall: overall };
//     });
//     return res.status(200).json({ success: true, items: withPercents, summary: { agentsTotal, doctorsTotal } });
//   }

//   if (req.method === "POST") {
//     const { 
//       name, 
//       policyType, 
//       version, 
//       effectiveDate, 
//       status = "Active", 
//       documentUrl = "",
//       department = "",
//       appliesToRoles = [],
//       description = "",
//       approvalRequired = false,
//       mandatoryAck = false
//     } = req.body;
//     const normalizedVersion = String(version || "1.0");
//     if (!name || !policyType) {
//       const missing = [
//         !name ? "name" : null,
//         !policyType ? "policyType" : null,
//       ].filter(Boolean).join(", ");
//       return res.status(400).json({ success: false, message: `Missing required fields: ${missing}` });
//     }
//     // Normalize appliesToRoles and compute appliesTo string on backend
//     const allowedRoles = ["agent", "doctorStaff"];
//     let normalizedRoles = Array.isArray(appliesToRoles) ? appliesToRoles.map(r => String(r).trim()) : [];
//     // Map labels to keys if labels were sent
//     normalizedRoles = normalizedRoles.map(r => {
//       const lower = r.toLowerCase();
//       if (lower === "agent") return "agent";
//       if (lower === "doctorstaff") return "doctorStaff";
//       if (lower === "doctor_staff") return "doctorStaff";
//       if (lower === "all staff" || lower === "all") return "all";
//       return r;
//     });
//     // Filter only allowed ones
//     const selected = normalizedRoles.includes("all") ? allowedRoles : normalizedRoles.filter(r => allowedRoles.includes(r));
//     const appliesToString = normalizedRoles.includes("all")
//       ? "All Staff"
//       : selected.length === 2
//         ? "Agent, DoctorStaff"
//         : selected[0] === "agent"
//           ? "Agent"
//           : selected[0] === "doctorStaff"
//             ? "DoctorStaff"
//             : "Agent";
//     const item = await Policy.create({
//       clinicId,
//       name,
//       policyType,
//       department,
//       appliesTo: appliesToString,
//       appliesToRoles: selected,
//       description,
//       approvalRequired: !!approvalRequired,
//       version: normalizedVersion,
//       effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
//       status,
//       documentUrl,
//       mandatoryAck: !!mandatoryAck,
//     });
//     // Auto-assign acknowledgments to users of selected roles
//     try {
//       if (Array.isArray(selected) && selected.length) {
//         const users = await User.find({ clinicId, role: { $in: selected } }).select("_id name role");
//         const assigned = item.effectiveDate || new Date();
//         const bulkOps = users.map(u => ({
//           updateOne: {
//             filter: { clinicId, staffId: u._id, documentType: "Policy", documentId: item._id },
//             update: {
//               $set: {
//                 clinicId,
//                 staffId: u._id,
//                 staffName: u.name,
//                 role: u.role,
//                 documentType: "Policy",
//                 documentId: item._id,
//                 documentName: name,
//                 version,
//                 status: "Pending",
//                 assignedDate: assigned,
//                 dueDate: null,
//               }
//             },
//             upsert: true
//           }
//         }));
//         if (bulkOps.length) await Acknowledgment.bulkWrite(bulkOps, { ordered: false });
//       }
//     } catch (ackErr) {
//       console.error("Policy ack auto-assign error:", ackErr?.message);
//     }
//     return res.status(201).json({ success: true, item });
//   }

//   if (req.method === "PUT") {
//     const { id } = req.query;
//     if (!id) return res.status(400).json({ success: false, message: "Missing id" });
//     const update = { ...req.body };
//     const updated = await Policy.findOneAndUpdate({ _id: id, clinicId }, update, { new: true });
//     if (!updated) return res.status(404).json({ success: false, message: "Not found" });
//     try {
//       const selected = Array.isArray(updated.appliesToRoles) ? updated.appliesToRoles : [];
//       if (selected.length) {
//         const users = await User.find({ clinicId, role: { $in: selected } }).select("_id name role");
//         const assigned = updated.effectiveDate || new Date();
//         const bulkOps = users.map(u => ({
//           updateOne: {
//             filter: { clinicId, staffId: u._id, documentType: "Policy", documentId: updated._id },
//             update: {
//               $setOnInsert: {
//                 clinicId,
//                 staffId: u._id,
//                 staffName: u.name,
//                 role: u.role,
//                 documentType: "Policy",
//                 documentId: updated._id,
//                 documentName: updated.name,
//                 version: updated.version,
//                 assignedDate: assigned,
//                 dueDate: null,
//               },
//               $set: { status: "Pending" }
//             },
//             upsert: true
//           }
//         }));
//         if (bulkOps.length) await Acknowledgment.bulkWrite(bulkOps, { ordered: false });
//       }
//     } catch (ackErr) {
//       console.error("Policy ack ensure on update error:", ackErr?.message);
//     }
//     return res.status(200).json({ success: true, item: updated.toObject() });
//   }

//   if (req.method === "DELETE") {
//     const { id } = req.query;
//     if (!id) return res.status(400).json({ success: false, message: "Missing id" });
//     await Policy.deleteOne({ _id: id, clinicId });
//     await Acknowledgment.deleteMany({ clinicId, documentType: "Policy", documentId: id });
//     return res.status(200).json({ success: true });
//   }

//   return res.status(405).json({ success: false, message: "Method not allowed" });
// }
import dbConnect from "../../../lib/database";
import Policy from "../../../models/Policy";
import Acknowledgment from "../../../models/Acknowledgment";
import User from "../../../models/Users";
import { getUserFromReq } from "../lead-ms/auth";
import { getClinicIdFromUser } from "../lead-ms/permissions-helper";

// Helper function to format date to dd/mm/yyyy
const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

// Helper function to parse dd/mm/yyyy to Date object
const parseDate = (dateStr) => {
  if (!dateStr) return null;
  // If it's already a Date object or ISO string
  if (dateStr instanceof Date) return dateStr;
  if (typeof dateStr === 'string' && dateStr.includes('-')) {
    return new Date(dateStr);
  }
  // Parse dd/mm/yyyy format
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return new Date(`${year}-${month}-${day}`);
  }
  return new Date(dateStr);
};

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
    const { id, q, type, status } = req.query;
    if (id) {
      const item = await Policy.findOne({ _id: id, clinicId }).lean();
      if (!item) return res.status(404).json({ success: false, message: "Not found" });
      const agentsTotal = await User.countDocuments({ clinicId, role: "agent" });
      const doctorsTotal = await User.countDocuments({ clinicId, role: "doctorStaff" });
      const grouped = await Acknowledgment.aggregate([
        { $match: { clinicId, documentType: "Policy", documentId: item._id } },
        { $group: { _id: "$role", count: { $sum: 1 }, acknowledged: { $sum: { $cond: [{ $eq: ["$status", "Acknowledged"] }, 1, 0] } } } }
      ]);
      const roleStats = grouped.reduce((acc, r) => { acc[r._id] = r; return acc; }, {});
      const inferFromAppliesTo = (appliesTo) => {
        const txt = String(appliesTo || "").toLowerCase();
        const set = new Set();
        if (txt.includes("all")) { set.add("agent"); set.add("doctorStaff"); }
        if (txt.includes("agent")) set.add("agent");
        if (txt.includes("doctor")) set.add("doctorStaff");
        return set;
      };
      const applicable = new Set((item.appliesToRoles || []).length ? item.appliesToRoles : Array.from(inferFromAppliesTo(item.appliesTo)));
      const denom =
        (applicable.has("agent") ? agentsTotal : 0) +
        (applicable.has("doctorStaff") ? doctorsTotal : 0);
      const ackPercentAgent = applicable.has("agent") && agentsTotal > 0 ? ((roleStats.agent?.acknowledged || 0) / agentsTotal) * 100 : 0;
      const ackPercentDoctor = applicable.has("doctorStaff") && doctorsTotal > 0 ? ((roleStats.doctorStaff?.acknowledged || 0) / doctorsTotal) * 100 : 0;
      const ackOverall = denom > 0 ? (((roleStats.agent?.acknowledged || 0) + (roleStats.doctorStaff?.acknowledged || 0)) / denom) * 100 : (ackPercentAgent || ackPercentDoctor);
      
      // Format dates in the response
      const formattedItem = {
        ...item,
        effectiveDate: formatDate(item.effectiveDate),
        createdAt: formatDate(item.createdAt),
        updatedAt: formatDate(item.updatedAt),
        ackPercentAgent, 
        ackPercentDoctor, 
        ackOverall
      };
      
      return res.status(200).json({ success: true, item: formattedItem });
    }
    
    const query = { clinicId };
    if (q) query.name = { $regex: q, $options: "i" };
    if (type) query.policyType = type;
    if (status) query.status = status;
    const items = await Policy.find(query).sort({ updatedAt: -1 }).lean();
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
    const inferFromAppliesToList = (appliesTo) => {
      const txt = String(appliesTo || "").toLowerCase();
      const set = new Set();
      if (txt.includes("all")) { set.add("agent"); set.add("doctorStaff"); }
      if (txt.includes("agent")) set.add("agent");
      if (txt.includes("doctor")) set.add("doctorStaff");
      return set;
    };
    
    const withPercents = items.map(i => {
      const idStr = i._id.toString();
      const applicable = new Set((i.appliesToRoles || []).length ? i.appliesToRoles : Array.from(inferFromAppliesToList(i.appliesTo)));
      const pa = applicable.has("agent") && agentsTotal > 0 ? ((ackAgent[idStr] || 0) / agentsTotal) * 100 : 0;
      const pd = applicable.has("doctorStaff") && doctorsTotal > 0 ? ((ackDoctor[idStr] || 0) / doctorsTotal) * 100 : 0;
      const denom =
        (applicable.has("agent") ? agentsTotal : 0) +
        (applicable.has("doctorStaff") ? doctorsTotal : 0);
      const ackCount = (ackAgent[idStr] || 0) + (ackDoctor[idStr] || 0);
      const overall = denom > 0 ? (ackCount / denom) * 100 : (pa || pd);
      
      // Format dates in each item
      return { 
        ...i, 
        effectiveDate: formatDate(i.effectiveDate),
        createdAt: formatDate(i.createdAt),
        updatedAt: formatDate(i.updatedAt),
        ackPercentAgent: pa, 
        ackPercentDoctor: pd, 
        ackOverall: overall 
      };
    });
    
    return res.status(200).json({ 
      success: true, 
      items: withPercents, 
      summary: { agentsTotal, doctorsTotal } 
    });
  }

  if (req.method === "POST") {
    const { 
      name, 
      policyType, 
      version, 
      effectiveDate, 
      status = "Active", 
      documentUrl = "",
      department = "",
      appliesToRoles = [],
      description = "",
      approvalRequired = false,
      mandatoryAck = false
    } = req.body;
    
    const normalizedVersion = String(version || "1.0");
    
    if (!name || !policyType) {
      const missing = [
        !name ? "name" : null,
        !policyType ? "policyType" : null,
      ].filter(Boolean).join(", ");
      return res.status(400).json({ success: false, message: `Missing required fields: ${missing}` });
    }
    
    // Parse effective date from dd/mm/yyyy format
    const parsedEffectiveDate = parseDate(effectiveDate);
    
    // Normalize appliesToRoles and compute appliesTo string on backend
    const allowedRoles = ["agent", "doctorStaff"];
    let normalizedRoles = Array.isArray(appliesToRoles) ? appliesToRoles.map(r => String(r).trim()) : [];
    
    // Map labels to keys if labels were sent
    normalizedRoles = normalizedRoles.map(r => {
      const lower = r.toLowerCase();
      if (lower === "agent") return "agent";
      if (lower === "doctorstaff") return "doctorStaff";
      if (lower === "doctor_staff") return "doctorStaff";
      if (lower === "all staff" || lower === "all") return "all";
      return r;
    });
    
    // Filter only allowed ones
    const selected = normalizedRoles.includes("all") ? allowedRoles : normalizedRoles.filter(r => allowedRoles.includes(r));
    
    const appliesToString = normalizedRoles.includes("all")
      ? "All Staff"
      : selected.length === 2
        ? "Agent, DoctorStaff"
        : selected[0] === "agent"
          ? "Agent"
          : selected[0] === "doctorStaff"
            ? "DoctorStaff"
            : "Agent";
    
    const item = await Policy.create({
      clinicId,
      name,
      policyType,
      department,
      appliesTo: appliesToString,
      appliesToRoles: selected,
      description,
      approvalRequired: !!approvalRequired,
      version: normalizedVersion,
      effectiveDate: parsedEffectiveDate || new Date(),
      status,
      documentUrl,
      mandatoryAck: !!mandatoryAck,
    });
    
    // Auto-assign acknowledgments to users of selected roles
    try {
      if (Array.isArray(selected) && selected.length) {
        const staffIds = Array.isArray(req.body.staffIds) ? req.body.staffIds.filter(Boolean) : [];
        let users;
        if (staffIds.length) {
          users = await User.find({ clinicId, _id: { $in: staffIds } }).select("_id name role");
        } else {
          users = await User.find({ clinicId, role: { $in: selected } }).select("_id name role");
        }
        const assigned = item.effectiveDate || new Date();
        const bulkOps = users.map(u => ({
          updateOne: {
            filter: { clinicId, staffId: u._id, documentType: "Policy", documentId: item._id },
            update: {
              $set: {
                clinicId,
                staffId: u._id,
                staffName: u.name,
                role: u.role,
                documentType: "Policy",
                documentId: item._id,
                documentName: name,
                version,
                status: "Pending",
                assignedDate: assigned,
                dueDate: null,
              }
            },
            upsert: true
          }
        }));
        if (bulkOps.length) await Acknowledgment.bulkWrite(bulkOps, { ordered: false });
      }
    } catch (ackErr) {
      console.error("Policy ack auto-assign error:", ackErr?.message);
    }
    
    // Format dates in the response
    const formattedItem = {
      ...item.toObject(),
      effectiveDate: formatDate(item.effectiveDate),
      createdAt: formatDate(item.createdAt),
      updatedAt: formatDate(item.updatedAt),
    };
    
    return res.status(201).json({ success: true, item: formattedItem });
  }

  if (req.method === "PUT") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ success: false, message: "Missing id" });
    
    const update = { ...req.body };
    
    // Parse effective date if it exists
    if (update.effectiveDate) {
      update.effectiveDate = parseDate(update.effectiveDate);
    }
    
    const updated = await Policy.findOneAndUpdate({ _id: id, clinicId }, update, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: "Not found" });
    
    try {
      const selected = Array.isArray(updated.appliesToRoles) ? updated.appliesToRoles : [];
      if (selected.length) {
        const staffIds = Array.isArray(req.body.staffIds) ? req.body.staffIds.filter(Boolean) : [];
        let users;
        if (staffIds.length) {
          users = await User.find({ clinicId, _id: { $in: staffIds } }).select("_id name role");
        } else {
          users = await User.find({ clinicId, role: { $in: selected } }).select("_id name role");
        }
        const assigned = updated.effectiveDate || new Date();
        const bulkOps = users.map(u => ({
          updateOne: {
            filter: { clinicId, staffId: u._id, documentType: "Policy", documentId: updated._id },
            update: {
              $setOnInsert: {
                clinicId,
                staffId: u._id,
                staffName: u.name,
                role: u.role,
                documentType: "Policy",
                documentId: updated._id,
                documentName: updated.name,
                version: updated.version,
                assignedDate: assigned,
                dueDate: null,
              },
              $set: { status: "Pending" }
            },
            upsert: true
          }
        }));
        if (bulkOps.length) await Acknowledgment.bulkWrite(bulkOps, { ordered: false });
      }
    } catch (ackErr) {
      console.error("Policy ack ensure on update error:", ackErr?.message);
    }
    
    // Format dates in the response
    const formattedItem = {
      ...updated.toObject(),
      effectiveDate: formatDate(updated.effectiveDate),
      createdAt: formatDate(updated.createdAt),
      updatedAt: formatDate(updated.updatedAt),
    };
    
    return res.status(200).json({ success: true, item: formattedItem });
  }

  if (req.method === "DELETE") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ success: false, message: "Missing id" });
    await Policy.deleteOne({ _id: id, clinicId });
    await Acknowledgment.deleteMany({ clinicId, documentType: "Policy", documentId: id });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
