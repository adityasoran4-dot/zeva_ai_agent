//pages/api/compliance/playbooks.js
import dbConnect from '../../../lib/database';
import Playbook from "../../../models/Playbook";
import { getUserFromReq } from "../lead-ms/auth";
import { getClinicIdFromUser } from "../lead-ms/permissions-helper";
import Acknowledgment from "../../../models/Acknowledgment";

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

  // if (req.method === "GET") {
  //   const { id, q, department, risk, status } = req.query;
  //   if (id) {
  //     const item = await Playbook.findOne({ _id: id, clinicId }).lean();
  //     if (!item) return res.status(404).json({ success: false, message: "Not found" });
  //     return res.status(200).json({ success: true, item });
  //   }
  //   const query = { clinicId };
  //   if (q) query.scenarioName = { $regex: q, $options: "i" };
  //   if (department) query.department = department;
  //   if (risk) query.riskLevel = risk;
  //   if (status) query.status = status;
  //   const items = await Playbook.find(query).sort({ updatedAt: -1 }).lean();
  //   return res.status(200).json({ success: true, items });
  // }

  if (req.method === "GET") {
  const { id, q, department, risk, status } = req.query;
  if (id) {
    const item = await Playbook.findOne({ _id: id, clinicId })
      .populate('owner', 'name email')
      .lean();
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    // Add ownerName for display
    if (item.owner) {
      item.ownerName = item.owner.name || "Clinic Admin";
    }
    return res.status(200).json({ success: true, item });
  }
  const query = { clinicId };
  if (q) query.scenarioName = { $regex: q, $options: "i" };
  if (department) query.department = department;
  if (risk) query.riskLevel = risk;
  if (status) query.status = status;
  const items = await Playbook.find(query)
    .populate('owner', 'name email')
    .sort({ updatedAt: -1 })
    .lean();
  
  // Add ownerName for display
  items.forEach(item => {
    if (item.owner) {
      item.ownerName = item.owner.name || "Clinic Admin";
    } else {
      item.ownerName = "Clinic Admin";
    }
  });
  
  return res.status(200).json({ success: true, items });
}

  if (req.method === "POST") {
    const { 
      scenarioName, 
      triggerCondition, 
      department, 
      riskLevel, 
      owner, 
      resolutionTimeMinutes = 0, 
      escalationLevel = "Level 1", 
      status = "Active", 
      documentUrl = "",
      steps = [],
      expectedResolutionTime = "",
      escalationPath = [],
      trainingMaterials = [],
      attachments = []
    } = req.body;
    const ownerId = owner && typeof owner === "string" && owner.length === 24 ? owner : user._id;
    if (!scenarioName || !triggerCondition || !department || !riskLevel || !ownerId) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    const item = await Playbook.create({
      clinicId,
      scenarioName,
      triggerCondition,
      department,
      riskLevel,
      owner: ownerId,
      resolutionTimeMinutes,
      escalationLevel,
      status,
      documentUrl: String(documentUrl || "").trim(),
      steps,
      expectedResolutionTime,
      escalationPath,
      trainingMaterials,
      attachments,
    });
    return res.status(201).json({ success: true, item });
  }

  if (req.method === "PUT") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ success: false, message: "Missing id" });
    const update = { ...req.body };
    if (typeof update.documentUrl === "string") update.documentUrl = update.documentUrl.trim();
    const item = await Playbook.findOneAndUpdate({ _id: id, clinicId }, update, { new: true }).lean();
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    return res.status(200).json({ success: true, item });
  }

  if (req.method === "DELETE") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ success: false, message: "Missing id" });
    await Playbook.deleteOne({ _id: id, clinicId });
    await Acknowledgment.deleteMany({ clinicId, documentType: "Playbook", documentId: id });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
