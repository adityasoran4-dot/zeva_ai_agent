
import dbConnect from '../../../lib/database';
import Billing from '../../../models/Billing';
import PatientRegistration from '../../../models/PatientRegistration';
import Appointment from '../../../models/Appointment';
import User from '../../../models/Users';
import Clinic from '../../../models/Clinic';
import AgentProfile from '../../../models/AgentProfile';
import { getUserFromReq } from "../lead-ms/auth";
import { getClinicIdFromUser } from "../lead-ms/permissions-helper";
import mongoose from 'mongoose';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Get authenticated user
    const authUser = await getUserFromReq(req);
    if (!authUser) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Get clinic ID
    const result = await getClinicIdFromUser(authUser);
    const clinicId = result.clinicId;
    if (!clinicId && authUser.role !== 'admin') {
      return res.status(400).json({ success: false, message: 'Clinic ID not found' });
    }

    const {
      startDate,
      endDate,
      patientName,
      offerType,
      page = '1',
      pageSize = '20',
    } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
      dateFilter.$gte.setHours(0, 0, 0, 0);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
      dateFilter.$lte.setHours(23, 59, 59, 999);
    }

    // Build match query - ONLY fetch billings where offer was used
    const matchQuery = {
      clinicId: clinicId ? new mongoose.Types.ObjectId(clinicId) : undefined,
    };

    // Only billings where offer was applied or cashback was used
    matchQuery.$or = [
      { offerApplied: true },
      { isCashbackApplied: true },
      { cashbackWalletUsed: { $gt: 0 } },  // Patient used cashback wallet
      { offerDiscountAmount: { $gt: 0 } },  // Any offer discount applied
      { offerType: { $in: ['instant_discount', 'cashback', 'bundle'] } },
      { offerFreeSession: { $exists: true, $not: { $size: 0 } } },  // Has free sessions (bundle offers)
      { usedFreeSessions: { $exists: true, $not: { $size: 0 } } },  // Free sessions were consumed
      { cashbackAmount: { $gt: 0 } },  // Cashback was earned
    ];

    if (Object.keys(dateFilter).length > 0) {
      matchQuery.invoicedDate = dateFilter;
    }

    // Build aggregation pipeline
    const pipeline = [
      { $match: matchQuery },
      // Lookup patient details
      {
        $lookup: {
          from: 'patientregistrations',
          localField: 'patientId',
          foreignField: '_id',
          as: 'patient',
        },
      },
      { $unwind: { path: '$patient', preserveNullAndEmptyArrays: true } },
      // Lookup appointment for additional context
      {
        $lookup: {
          from: 'appointments',
          localField: 'appointmentId',
          foreignField: '_id',
          as: 'appointment',
        },
      },
      { $unwind: { path: '$appointment', preserveNullAndEmptyArrays: true } },
      // Lookup offer details
      {
        $lookup: {
          from: 'offers',
          localField: 'offerId',
          foreignField: '_id',
          as: 'offer',
        },
      },
      { $unwind: { path: '$offer', preserveNullAndEmptyArrays: true } },
      // Lookup cashback offer details
      {
        $lookup: {
          from: 'offers',
          localField: 'cashbackOfferId',
          foreignField: '_id',
          as: 'cashbackOffer',
        },
      },
      { $unwind: { path: '$cashbackOffer', preserveNullAndEmptyArrays: true } },
      // Sort by invoiced date descending
      { $sort: { invoicedDate: -1 } },
    ];

    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize, 10)));
    const skipNum = (pageNum - 1) * pageSizeNum;

    // Add pagination
    const paginatedPipeline = [
      ...pipeline,
      { $skip: skipNum },
      { $limit: pageSizeNum },
    ];

    // Execute main query
    const billings = await Billing.aggregate(paginatedPipeline);

    // Get total count for pagination
    const countPipeline = [{ $match: matchQuery }, { $count: 'total' }];
    const countResult = await Billing.aggregate(countPipeline);
    const totalCount = countResult[0]?.total || 0;

    // Transform data for the report
    const offerTrackData = billings.map((billing) => {
      // Get patient name
      const patientNameVal = billing.patient
        ? `${billing.patient.firstName || ''} ${billing.patient.lastName || ''}`.trim()
        : billing.appointment?.patientName || 'Unknown';

      // Determine offer details
      let offerDetails = {
        offerName: null,
        offerType: null,
        offerDiscountPercent: 0,
        offerDiscountAmount: 0,
        instantDiscountValue: null,
        cashbackAmount: 0,
        freeSessions: [],
        bundleSessionsAdded: 0,
      };

      // Check for regular offer
      if (billing.offerApplied && billing.offerId) {
        offerDetails.offerName = billing.offerName || billing.offer?.title || 'Unknown Offer';
        offerDetails.offerType = billing.offerType || 'instant_discount';
        offerDetails.offerDiscountAmount = billing.offerDiscountAmount || 0;

        // Get discount percentage from offer or calculate
        if (billing.offer?.discountMode === 'percentage') {
          offerDetails.offerDiscountPercent = billing.offer?.discountValue || 0;
        } else if (billing.originalAmount && billing.originalAmount > 0) {
          offerDetails.offerDiscountPercent = Math.round(
            (billing.offerDiscountAmount / billing.originalAmount) * 100
          );
        }

        // Get instant discount value if applicable
        if (billing.offer?.discountMode === 'flat') {
          offerDetails.instantDiscountValue = billing.offerDiscountAmount;
        }
      }

      // Check for cashback offer (EARNED)
      if (billing.isCashbackApplied) {
        offerDetails.offerType = 'cashback';
        offerDetails.cashbackAmount = billing.cashbackAmount || 0;
        offerDetails.offerName = billing.cashbackOfferName || billing.cashbackOffer?.title || 'Cashback Offer';
      }

      // Check if patient USED cashback wallet (spending earned cashback)
      if (billing.cashbackWalletUsed > 0 && !billing.isCashbackApplied) {
        // Only set if not already set by cashback earned
        if (!offerDetails.offerType) {
          offerDetails.offerType = 'cashback';
          offerDetails.offerName = 'Cashback Wallet Used';
        }
        offerDetails.cashbackAmount = 0; // Not earning, just using
      }

      // Check for bundle offer (has free sessions)
      if (billing.offerType === 'bundle') {
        offerDetails.offerType = 'bundle';
        offerDetails.freeSessions = billing.offerFreeSession || [];
        offerDetails.bundleSessionsAdded = billing.bundleSessionsAdded || 0;
      }

      // Check for USED free sessions (consumed from previous billings)
      const usedFreeSessions = billing.usedFreeSessions || [];
      const usedFreeSessionCount = billing.usedFreeSessionCount || 0;
      
      // If billing only has usedFreeSessions but no offer, mark it for display
      if (usedFreeSessions.length > 0 && !billing.offerApplied && !billing.isCashbackApplied && billing.offerType !== 'bundle') {
        offerDetails.offerType = 'bundle';
        offerDetails.offerName = 'Free Session Redemption';
      }

      // Agent discount info
      const agentDiscount = billing.isAgentDiscountApplied
        ? {
            type: billing.agentDiscountType,
            amount: billing.agentDiscountAmount,
          }
        : null;

      // Doctor discount info
      const doctorDiscount = billing.isDoctorDiscountApplied
        ? {
            type: billing.doctorDiscountType,
            amount: billing.doctorDiscountAmount,
          }
        : null;

      // Get who applied the offer (use invoicedBy which already tracks who created the billing)
      const appliedBy = billing.invoicedBy || 'Unknown';

      // Cashback validity info
      const cashbackValidity = billing.isCashbackApplied && billing.cashbackEndDate
        ? {
            startDate: billing.cashbackStartDate,
            endDate: billing.cashbackEndDate,
            isExpired: new Date() > new Date(billing.cashbackEndDate),
          }
        : null;

      // Free session names for bundle offers
      const freeSessionNames = billing.offerFreeSession
        ? billing.offerFreeSession.join(', ')
        : '';

      // Used free session names (consumed in this billing)
      const usedFreeSessionNames = usedFreeSessions.join(', ');

      return {
        _id: billing._id,
        invoiceNumber: billing.invoiceNumber,
        invoicedDate: billing.invoicedDate,
        patientName: patientNameVal,
        treatment: billing.treatment || billing.package || 'N/A',
        service: billing.service,
        // Offer details
        offerName: offerDetails.offerName,
        offerType: offerDetails.offerType,
        offerDiscountPercent: offerDetails.offerDiscountPercent,
        offerDiscountAmount: offerDetails.offerDiscountAmount,
        instantDiscountValue: offerDetails.instantDiscountValue,
        cashbackEarned: offerDetails.cashbackAmount,
        cashbackWalletUsed: billing.cashbackWalletUsed || 0,
        freeSessionNames: freeSessionNames,
        bundleSessionsAdded: offerDetails.bundleSessionsAdded,
        // Used free sessions (redemptions)
        usedFreeSessions: usedFreeSessions,
        usedFreeSessionCount: usedFreeSessionCount,
        usedFreeSessionNames: usedFreeSessionNames,
        // Discounts
        agentDiscount,
        doctorDiscount,
        membershipDiscount: billing.membershipDiscountApplied > 0
          ? billing.membershipDiscountApplied
          : null,
        // Who applied
        offerAppliedBy: appliedBy,
        // Cashback validity
        cashbackValidity,
        // Original and final amounts
        originalAmount: billing.originalAmount || billing.amount,
        finalAmount: billing.amount,
        totalDiscount:
          (offerDetails.offerDiscountAmount || 0) +
          (agentDiscount?.amount || 0) +
          (doctorDiscount?.amount || 0) +
          (billing.membershipDiscountApplied || 0),
        // Payment details
        paid: billing.paid,
        paymentMethod: billing.paymentMethod,
        pending: billing.pending,
        // Refund status
        isOfferRefunded: billing.isOfferRefunded || false,
        refundedAt: billing.refundedAt,
        refundedBy: billing.refundedBy,
        refundedAmount: billing.refundedAmount,
      };
    });

    // Calculate summary statistics
    const summaryPipeline = [
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalBillings: { $sum: 1 },
          totalOfferDiscount: { $sum: '$offerDiscountAmount' },
          totalCashbackEarned: { $sum: '$cashbackAmount' },
          totalAgentDiscount: { $sum: '$agentDiscountAmount' },
          totalDoctorDiscount: { $sum: '$doctorDiscountAmount' },
          totalBundleSessions: { $sum: '$bundleSessionsAdded' },
          instantDiscountCount: {
            $sum: {
              $cond: [
                { $or: [
                  { $eq: ['$offerType', 'instant_discount'] },
                  { $and: [
                    { $eq: ['$offerApplied', true] },
                    { $eq: ['$offerType', null] },
                    { $eq: ['$isCashbackApplied', false] },
                    { $eq: ['$offerFreeSession', []] }
                  ]}
                ]},
                1,
                0
              ],
            },
          },
          cashbackCount: {
            $sum: {
              $cond: [
                { $or: [
                  { $eq: ['$isCashbackApplied', true] },
                  { $eq: ['$offerType', 'cashback'] },
                  { $gt: ['$cashbackWalletUsed', 0] }
                ]},
                1,
                0
              ],
            },
          },
          bundleCount: {
            $sum: {
              $cond: [
                { $or: [
                  { $eq: ['$offerType', 'bundle'] },
                  { $gt: ['$freeOfferSessionCount', 0] }
                ]},
                1,
                0
              ],
            },
          },
        },
      },
    ];

    const summaryResult = await Billing.aggregate(summaryPipeline);
    const summary = summaryResult[0] || {
      totalBillings: 0,
      totalOfferDiscount: 0,
      totalCashbackEarned: 0,
      totalAgentDiscount: 0,
      totalDoctorDiscount: 0,
      totalBundleSessions: 0,
      instantDiscountCount: 0,
      cashbackCount: 0,
      bundleCount: 0,
    };

    return res.status(200).json({
      success: true,
      data: offerTrackData,
      summary,
      pagination: {
        currentPage: pageNum,
        pageSize: pageSizeNum,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSizeNum),
      },
    });
  } catch (error) {
    console.error('Error fetching offer track report:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch offer track report',
    });
  }
}