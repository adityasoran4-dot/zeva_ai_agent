// pages/api/clinic/[id].js
import dbConnect from "../../../lib/database";
import PatientRegistration from "../../../models/PatientRegistration";
import PettyCash from "../../../models/PettyCash";
import User from "../../../models/Users";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// ---------------- Helper: verify JWT and get user ----------------
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

// ---------------- Check user role ----------------
function requireRole(user, roles = []) {
  return roles.includes(user.role);
}

// ---------------- Add to PettyCash if payment method is Cash ----------------
async function addToPettyCashIfCash(user, patient, paidAmount) {
  if (patient.paymentMethod === "Cash" && paidAmount > 0) {
    try {
      const pettyCashRecord = await PettyCash.create({
        staffId: user._id,
        patientName: `${patient.firstName || ''} ${patient.lastName || ''}`.trim(),
        patientEmail: patient.email || '',
        patientPhone: patient.mobileNumber || '',
        note: `Auto-added from patient payment update - Invoice: ${patient.invoiceNumber}`,
        allocatedAmounts: [{
          amount: paidAmount,
          receipts: [],
          date: new Date()
        }],
        expenses: []
      });

      await PettyCash.updateGlobalTotalAmount(paidAmount, 'add');
    } catch (error) {
      // Swallow petty cash errors to avoid breaking patient update
    }
  }
}

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid ID" });
  }

  try {
    // -------------------------------
    // GET: Fetch Invoice + Patient Info
    // -------------------------------
    if (req.method === "GET") {
      const invoice = await PatientRegistration.findById(id).lean();

      if (!invoice) return res.status(404).json({ message: "Invoice not found" });

      const invoiceClean = {
        ...invoice,
        _id: invoice._id.toString(),
        userId: invoice.userId?.toString(),
        invoicedDate: invoice.invoicedDate?.toISOString(),
        createdAt: invoice.createdAt?.toISOString(),
        updatedAt: invoice.updatedAt?.toISOString(),
        advanceClaimReleaseDate: invoice.advanceClaimReleaseDate?.toISOString(),
      };

      return res.status(200).json(invoiceClean);
    }

    // -------------------------------
    // PUT: Update Payment OR Advance Claim
    // -------------------------------
    if (req.method === "PUT") {
      // Authenticate user
      let user;
      try {
        user = await getUserFromToken(req);
      } catch (err) {
        return res.status(err.status || 401).json({ success: false, message: err.message });
      }

      // Check if user has permission
      if (!requireRole(user, ["clinic", "admin"])) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }

      const { updateType } = req.body; // 'payment' | 'status' | 'advanceClaim'
      const invoice = await PatientRegistration.findById(id);
      if (!invoice) return res.status(404).json({ message: "Invoice not found" });

      // Small helper to record a consistent, validated snapshot
      const pushHistorySnapshot = (extra = {}) => {
        const amountNum = Number(invoice.amount ?? 0);
        const paidNum = Number(invoice.paid ?? 0);
        const advanceNum = Number(invoice.advance ?? 0);
        const pendingNum = Math.max(0, amountNum - paidNum);
        invoice.paymentHistory.push({
          amount: amountNum,
          paid: paidNum,
          advance: advanceNum,
          pending: pendingNum,
          paymentMethod: invoice.paymentMethod || "",
          updatedAt: new Date(),
          ...extra,
        });
      };

      // -------------------------------
      // OPTION 1: Payment Update
      // -------------------------------
      if (updateType === "payment") {
        let { amount, paying, paymentMethod } = req.body;

        const currentAmount = invoice.amount ?? 0;
        const currentPaid = invoice.paid ?? 0;

        const newAmount = amount !== undefined ? Number(amount) : currentAmount;
        paying = paying !== undefined ? Number(paying) : 0;
        paymentMethod = paymentMethod || invoice.paymentMethod || "";

        const newPaid = currentPaid + paying;
        const totalAdvance = Math.max(0, (newPaid - currentAmount) / 2);
        const newAdvance = totalAdvance;
        const finalPending = Math.max(0, currentAmount - newPaid);

        if (newAmount !== currentAmount) {
          invoice.amount = newAmount;
        }
        invoice.paid = newPaid;
        invoice.advance = newAdvance;
        invoice.pending = finalPending;

        invoice.advance = Math.max(0, (invoice.paid - invoice.amount) / 2);
        invoice.pending = Math.max(0, invoice.amount - invoice.paid);
        invoice.paymentMethod = paymentMethod;

        pushHistorySnapshot({
          amount: newAmount,
          paid: newPaid,
          advance: Math.max(0, newPaid - newAmount),
          pending: Math.max(0, newAmount - newPaid),
          paymentMethod,
          paying,
        });

        if (paying > 0 && paymentMethod === "Cash") {
          await addToPettyCashIfCash(user, invoice, paying);
        }
      } 
      // -------------------------------
      // OPTION 2: Status Update
      // -------------------------------
      else if (updateType === "status") {
        const { status, rejectionNote } = req.body;

        if (status !== undefined) invoice.status = status;
        if (rejectionNote !== undefined) invoice.rejectionNote = rejectionNote;

        invoice.pending = Math.max(0, invoice.amount - invoice.paid);
        pushHistorySnapshot({ status: invoice.status, rejectionNote: invoice.rejectionNote });
      } 
      // -------------------------------
      // OPTION 3: Advance Claim Update
      // -------------------------------
      else if (updateType === "advanceClaim") {
        const {
          advanceClaimStatus,
          advanceClaimCancellationRemark,
          advanceClaimReleaseDate,
          advanceClaimReleasedBy,
        } = req.body;

        if (advanceClaimStatus !== undefined)
          invoice.advanceClaimStatus = advanceClaimStatus;

        if (advanceClaimCancellationRemark !== undefined)
          invoice.advanceClaimCancellationRemark = advanceClaimCancellationRemark;

        if (advanceClaimReleaseDate !== undefined)
          invoice.advanceClaimReleaseDate = advanceClaimReleaseDate
            ? new Date(advanceClaimReleaseDate)
            : null;

        if (advanceClaimReleasedBy !== undefined)
          invoice.advanceClaimReleasedBy = advanceClaimReleasedBy;

        pushHistorySnapshot({
          advanceClaimStatus: invoice.advanceClaimStatus,
          advanceClaimCancellationRemark: invoice.advanceClaimCancellationRemark,
        });
      } 
      else {
        return res.status(400).json({ message: "Invalid update type" });
      }

      await invoice.save();

      return res.status(200).json({
        message:
          updateType === "payment"
            ? "Payment updated successfully"
            : updateType === "status"
            ? "Status updated successfully"
            : "Advance claim status updated successfully",
        updatedInvoice: {
          ...invoice.toObject(),
          _id: invoice._id.toString(),
          userId: invoice.userId?.toString(),
          invoicedDate: invoice.invoicedDate?.toISOString(),
          createdAt: invoice.createdAt?.toISOString(),
          updatedAt: invoice.updatedAt?.toISOString(),
          advanceClaimReleaseDate: invoice.advanceClaimReleaseDate?.toISOString(),
        },
      });
    }

    // -------------------------------
    // Method Not Allowed
    // -------------------------------
    res.setHeader("Allow", ["GET", "PUT"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    res.status(500).json({ message: err?.message || "Server error" });
  }
}

