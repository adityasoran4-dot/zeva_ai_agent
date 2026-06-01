//pages/api/compliance/acknowledgments.js
import dbConnect from '../../../lib/database';
import Acknowledgment from "../../../models/Acknowledgment";
import Notification from "../../../models/Notification";
import { emitNotificationToUser } from "../push-notification/socketio";
import { getUserFromReq } from '../lead-ms/auth';
import { getClinicIdFromUser } from "../lead-ms/permissions-helper";
import SOP from "../../../models/SOP";
import Policy from "../../../models/Policy";

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
    const { q, status, type, id } = req.query;
    if (id) {
      const item = await Acknowledgment.findOne({ _id: id, clinicId }).lean();
      if (!item) {
        return res.status(404).json({ success: false, message: "Acknowledgment not found" });
      }
      return res.status(200).json({ success: true, item });
    } else {
      const query = { clinicId };
      if (status) query.status = status;
      if (type) query.documentType = type;
      if (q) {
        query.$or = [
          { staffName: { $regex: q, $options: "i" } },
          { documentName: { $regex: q, $options: "i" } },
        ];
      }
      const showAll = String(req.query.all || "").toLowerCase();
      const wantsAll = showAll === "1" || showAll === "true";
      if (!wantsAll && ["agent", "doctorStaff", "staff"].includes(user.role)) {
        query.staffId = user._id;
      }
      let items = await Acknowledgment.find(query).sort({ updatedAt: -1 });
      // Auto-mark overdue: prefer SOP.acknowledgmentDeadline; fallback to ack.dueDate
      const now = new Date();
      const sopIds = items.filter(i => i.documentType === "SOP").map(i => i.documentId);
      const sopMap = sopIds.length
        ? (await SOP.find({ _id: { $in: sopIds }, clinicId }).select("_id acknowledgmentDeadline").lean())
            .reduce((acc, s) => { acc[s._id.toString()] = s.acknowledgmentDeadline ? new Date(s.acknowledgmentDeadline) : null; return acc; }, {})
        : {};
      const toUpdate = [];
      const endOfDay = (d) => {
        const t = new Date(d);
        t.setHours(23, 59, 59, 999);
        return t;
      };
      for (const ack of items) {
        const sopDeadline = ack.documentType === "SOP" ? sopMap[ack.documentId.toString()] : null;
        const due = sopDeadline || ack.dueDate || null;
        if (!due) continue;
        const deadlineEOD = endOfDay(due);
        if (ack.acknowledgedOn) {
          if (new Date(ack.acknowledgedOn) > deadlineEOD && ack.status !== "Overdue") {
            ack.status = "Overdue";
            toUpdate.push(ack.save());
          }
        } else {
          if (now > deadlineEOD && ack.status !== "Overdue") {
            ack.status = "Overdue";
            toUpdate.push(ack.save());
          }
        }
      }
      if (toUpdate.length) {
        await Promise.all(toUpdate);
        items = await Acknowledgment.find(query).sort({ updatedAt: -1 });
      }
      return res.status(200).json({ success: true, items: items.map(i => i.toObject()) });
    }
  }

  if (req.method === "POST") {
    const {
      staffId,
      staffName,
      role,
      documentType,
      documentId,
      documentName,
      version = "",
      status = "Pending",
      assignedDate = null,
      dueDate = null,
      acknowledgedOn = null,
      notifyOnly = false,
    } = req.body;

    if (!staffId || !staffName || !role || !documentType || !documentId || !documentName) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    try {
      if (!notifyOnly) {
        // Resolve defaults from document metadata when not provided
        let resolvedAssigned = assignedDate ? new Date(assignedDate) : new Date();
        let resolvedDue = dueDate ? new Date(dueDate) : null;
        let resolvedVersion = version || "";
        let initialStatus = status || "Pending";
        if (documentType === "SOP") {
          const sop = await SOP.findOne({ _id: documentId, clinicId }).lean();
          if (sop) {
            resolvedAssigned = sop.effectiveDate ? new Date(sop.effectiveDate) : resolvedAssigned;
            resolvedDue = sop.reviewDate ? new Date(sop.reviewDate) : resolvedDue;
            resolvedVersion = resolvedVersion || sop.version || "";
            const deadline = sop.acknowledgmentDeadline ? new Date(sop.acknowledgmentDeadline) : null;
            if (!acknowledgedOn && deadline) {
              const eod = new Date(deadline);
              eod.setHours(23,59,59,999);
              if (new Date() > eod) initialStatus = "Overdue";
            }
          }
        } else if (documentType === "Policy") {
          const pol = await Policy.findOne({ _id: documentId, clinicId }).lean();
          if (pol) {
            resolvedAssigned = pol.effectiveDate ? new Date(pol.effectiveDate) : resolvedAssigned;
            resolvedVersion = resolvedVersion || pol.version || "";
          }
        }
        const payload = {
          clinicId,
          staffId,
          staffName,
          role,
          documentType,
          documentId,
          documentName,
          version: resolvedVersion,
          status: initialStatus,
          assignedDate: resolvedAssigned,
          dueDate: resolvedDue,
          acknowledgedOn,
        };
        const created = await Acknowledgment.findOneAndUpdate(
          { clinicId, staffId, documentType, documentId },
          payload,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        // Create and emit notification
        const message = `Acknowledgment assigned: ${documentType} "${documentName}"`;
        const notification = await Notification.create({
          user: staffId,
          message,
          type: "acknowledgment",
          relatedAcknowledgment: created._id,
        });
        emitNotificationToUser(staffId, notification);
        return res.status(200).json({ success: true, item: created, notification });
      } else {
        // Only send notification without modifying acknowledgment record
        const message = `Please review: ${documentType} "${documentName}"`;
        // Try to find existing ack to link
        const existing = await Acknowledgment.findOne({ clinicId, staffId, documentType, documentId }).lean();
        const notification = await Notification.create({
          user: staffId,
          message,
          type: "acknowledgment",
          relatedAcknowledgment: existing?._id,
        });
        emitNotificationToUser(staffId, notification);
        return res.status(200).json({ success: true, notification });
      }
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "PATCH") {
    const { acknowledgmentId, status, signatureDataUrl } = req.body;
    if (!acknowledgmentId || (typeof status !== "string" && !signatureDataUrl)) {
      return res.status(400).json({ success: false, message: "acknowledgmentId and (status or signatureDataUrl) required" });
    }
    const ack = await Acknowledgment.findOne({ _id: acknowledgmentId, clinicId });
    if (!ack) {
      return res.status(404).json({ success: false, message: "Acknowledgment not found" });
    }
    // Only assigned staff or clinic/admin can update
    const isAssignedStaff = ack.staffId?.toString() === user._id.toString();
    const isPrivileged = ["clinic", "admin"].includes(user.role);
    if (!isAssignedStaff && !isPrivileged) {
      return res.status(403).json({ success: false, message: "Not allowed to update this acknowledgment" });
    }
    const wantsAck = typeof status === "string" && status === "Acknowledged";
    const hasValidSignatureInBody = typeof signatureDataUrl === "string" && signatureDataUrl.startsWith("data:image/");
    const hasExistingSignature = !!ack.signatureDataUrl;
    if (wantsAck && !hasValidSignatureInBody && !hasExistingSignature) {
      return res.status(400).json({ success: false, message: "Signature is required to mark as Acknowledged" });
    }
    if (hasValidSignatureInBody) {
      ack.signatureDataUrl = signatureDataUrl;
      ack.signatureBy = user?.name || user?.email || "";
      ack.signatureAt = new Date();
    }
    if (typeof status === "string") {
      ack.status = status;
      if (status === "Acknowledged") {
        ack.acknowledgedOn = new Date();
        const endOfDay = (d) => { const t = new Date(d); t.setHours(23,59,59,999); return t; };
        const due = ack.dueDate;
        if (due && ack.acknowledgedOn > endOfDay(due)) {
          ack.status = "Overdue";
        }
      } else if (status === "Viewed" && !ack.acknowledgedOn) {
      }
    }
    await ack.save();
    return res.status(200).json({ success: true, item: ack });
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
