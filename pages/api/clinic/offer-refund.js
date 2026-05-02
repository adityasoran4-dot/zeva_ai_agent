import dbConnect from '../../../lib/database';
import Billing from '../../../models/Billing';
import PatientRegistration from '../../../models/PatientRegistration';
import { getUserFromReq } from '../lead-ms/auth';
import { getClinicIdFromUser } from '../lead-ms/permissions-helper';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const authUser = await getUserFromReq(req);
    if (!authUser) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const result = await getClinicIdFromUser(authUser);
    const clinicId = result.clinicId;
    if (!clinicId && authUser.role !== 'admin') {
      return res.status(400).json({ success: false, message: 'Clinic ID not found' });
    }

    const { billingId } = req.body;
    if (!billingId) {
      return res.status(400).json({ success: false, message: 'Billing ID is required' });
    }

    const billing = await Billing.findById(billingId);
    if (!billing) {
      return res.status(404).json({ success: false, message: 'Billing record not found' });
    }

    if (billing.clinicId.toString() !== clinicId?.toString() && authUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (billing.isOfferRefunded) {
      return res.status(400).json({ success: false, message: 'Offers already refunded' });
    }

    const refundedOffers = [];
    let totalCashbackRefunded = 0;
    let totalCashbackWalletReversed = 0;
    const freeSessionsRefunded = [];
    const freeSessionsRestored = [];

    // Case 1: This billing CONSUMED free sessions (usedFreeSessions)
    // When refunded, we need to restore those sessions back to the original billings
    if (billing.usedFreeSessions && billing.usedFreeSessions.length > 0) {
      console.log('[RefundAPI] Billing consumed free sessions, restoring them:', billing.usedFreeSessions);
      
      // Find all billings for this patient that have free sessions available
      const patientBillings = await Billing.find({
        patientId: billing.patientId,
        offerType: 'bundle',
        offerFreeSession: { $exists: true },
        _id: { $ne: billing._id } // Exclude current billing
      }).sort({ createdAt: 1 }); // Oldest first (FIFO)

      // Restore sessions to the original billing records (reverse of consumption)
      let sessionsToRestore = [...billing.usedFreeSessions];
      
      for (const prevBilling of patientBillings) {
        if (sessionsToRestore.length === 0) break;
        
        const currentFreeSessions = prevBilling.offerFreeSession || [];
        const restoredSessions = [...currentFreeSessions];
        let restoredCount = 0;
        
        // Add back the sessions that were consumed
        for (const session of sessionsToRestore) {
          // Restore session by adding it back to offerFreeSession
          restoredSessions.push(session);
          restoredCount++;
          freeSessionsRestored.push(session);
          console.log(`[RefundAPI] Restoring free session "${session}" to billing ${prevBilling.invoiceNumber}`);
        }
        
        // Remove restored sessions from the list
        sessionsToRestore = sessionsToRestore.slice(restoredCount);
        
        // Update the billing with restored sessions
        if (restoredCount > 0) {
          await Billing.findByIdAndUpdate(prevBilling._id, {
            $set: {
              offerFreeSession: restoredSessions,
              freeOfferSessionCount: restoredSessions.length
            }
          });
          console.log(`[RefundAPI] Restored ${restoredCount} sessions to billing ${prevBilling.invoiceNumber}`);
        }
      }

      if (sessionsToRestore.length > 0) {
        console.warn('[RefundAPI] Warning: Could not restore all sessions:', sessionsToRestore);
      }
    }

    // Case 2: This billing GRANTED free sessions (bundle offer)
    // When refunded, we remove the free sessions from this billing
    if (billing.offerType === 'bundle' && billing.offerFreeSession?.length > 0) {
      freeSessionsRefunded.push(...billing.offerFreeSession);
      
      // Remove free sessions from this billing (they're being refunded)
      await Billing.findByIdAndUpdate(billing._id, {
        $set: {
          offerFreeSession: [],
          freeOfferSessionCount: 0
        }
      });
      
      console.log(`[RefundAPI] Removed ${billing.offerFreeSession.length} free sessions from billing ${billing.invoiceNumber}`);
      
      refundedOffers.push({
        offerType: 'bundle',
        offerId: billing.offerId || null,
        offerName: billing.offerName || 'Bundle Offer',
        amount: 0,
        freeSessionsRefunded: [...billing.offerFreeSession],
        freeSessionsRestored: [...freeSessionsRestored],
        cashbackRefunded: 0,
        cashbackWalletUsageReversed: 0
      });
    } else if (freeSessionsRestored.length > 0) {
      // Only restored sessions, no bundle offer on this billing
      refundedOffers.push({
        offerType: 'bundle',
        offerId: null,
        offerName: 'Free Session Restoration',
        amount: 0,
        freeSessionsRefunded: [],
        freeSessionsRestored: [...freeSessionsRestored],
        cashbackRefunded: 0,
        cashbackWalletUsageReversed: 0
      });
    }

    // Handle Cashback Earned - REVOKE/REMOVE from Patient Wallet
    // When refunding a billing where cashback was EARNED, we need to remove that cashback from wallet
    if (billing.isCashbackApplied && billing.cashbackAmount > 0) {
      const patient = await PatientRegistration.findById(billing.patientId);
      if (!patient) {
        return res.status(404).json({ success: false, message: 'Patient not found' });
      }

      const revokeAmount = billing.cashbackAmount;
      
      // DEDUCT the earned cashback from wallet (revoke it)
      const currentWalletBalance = patient.walletBalance || 0;
      const newWalletBalance = Math.max(0, currentWalletBalance - revokeAmount);
      
      patient.walletBalance = newWalletBalance;
      patient.walletTransactions = patient.walletTransactions || [];
      patient.walletTransactions.push({
        amount: revokeAmount,
        type: 'debit',  // Debit because we're removing cashback
        source: 'refund',
        offerId: billing.cashbackOfferId || null,
        offerName: billing.cashbackOfferName || 'Cashback Revoked',
        billingId: billing._id,
        invoiceNumber: billing.invoiceNumber,
        description: `Cashback revoked due to refund of invoice ${billing.invoiceNumber}`,
        createdAt: new Date()
      });
      
      await patient.save();
      totalCashbackRefunded = revokeAmount;
      
      console.log(`[RefundAPI] Revoked ${revokeAmount} cashback from wallet for patient ${patient._id}`);
      
      refundedOffers.push({
        offerType: 'cashback',
        offerId: billing.cashbackOfferId || null,
        offerName: billing.cashbackOfferName || 'Cashback Offer',
        amount: revokeAmount,
        freeSessionsRefunded: [],
        cashbackRefunded: revokeAmount,
        cashbackWalletUsageReversed: 0
      });
    }

    // Handle Cashback Wallet Usage - Reverse the usage
    if (billing.cashbackWalletUsed > 0) {
      const patient = await PatientRegistration.findById(billing.patientId);
      if (!patient) {
        return res.status(404).json({ success: false, message: 'Patient not found' });
      }

      const reversalAmount = billing.cashbackWalletUsed;
      patient.walletBalance = (patient.walletBalance || 0) + reversalAmount;
      patient.walletTransactions = patient.walletTransactions || [];
      patient.walletTransactions.push({
        amount: reversalAmount,
        type: 'credit',
        source: 'refund',
        offerId: null,
        offerName: 'Cashback Wallet Reversal',
        billingId: billing._id,
        invoiceNumber: billing.invoiceNumber,
        description: `Cashback wallet reversal for invoice ${billing.invoiceNumber}`,
        createdAt: new Date()
      });
      
      await patient.save();
      totalCashbackWalletReversed = reversalAmount;
      
      const existingCashbackEntry = refundedOffers.find(o => o.offerType === 'cashback');
      if (existingCashbackEntry) {
        existingCashbackEntry.cashbackWalletUsageReversed = reversalAmount;
      } else {
        refundedOffers.push({
          offerType: 'cashback',
          offerId: null,
          offerName: 'Cashback Wallet Reversal',
          amount: 0,
          freeSessionsRefunded: [],
          cashbackRefunded: 0,
          cashbackWalletUsageReversed: reversalAmount
        });
      }
    }

    // Handle Instant Discount - Record the refund
    if (billing.offerApplied && billing.offerType === 'instant_discount' && billing.offerDiscountAmount > 0) {
      refundedOffers.push({
        offerType: 'instant_discount',
        offerId: billing.offerId || null,
        offerName: billing.offerName || 'Instant Discount',
        amount: billing.offerDiscountAmount,
        freeSessionsRefunded: [],
        cashbackRefunded: 0,
        cashbackWalletUsageReversed: 0
      });
    }

    // Update the billing record
    const totalRefundedAmount = totalCashbackRefunded + totalCashbackWalletReversed;
    
    await Billing.findByIdAndUpdate(billingId, {
      $set: {
        isOfferRefunded: true,
        refundedAt: new Date(),
        refundedBy: authUser.name || 'Clinic Staff',
        refundedAmount: totalRefundedAmount,
        refundedOffers: refundedOffers
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Offer refund processed successfully',
      data: {
        billingId: billing._id,
        invoiceNumber: billing.invoiceNumber,
        freeSessionsRestored: freeSessionsRestored.length,
        freeSessionNames: freeSessionsRestored,
        freeSessionsRemoved: freeSessionsRefunded.length,
        freeSessionsRemovedNames: freeSessionsRefunded,
        cashbackRevoked: totalCashbackRefunded,  // Cashback that was revoked (earned but now removed)
        cashbackRestored: totalCashbackWalletReversed,  // Cashback that was restored (used but now returned)
        totalRefunded: totalRefundedAmount,
        refundedOffers,
        summary: {
          cashbackAction: totalCashbackRefunded > 0 ? 'REVOKED' : (totalCashbackWalletReversed > 0 ? 'RESTORED' : 'NONE'),
          cashbackAmount: totalCashbackRefunded > 0 ? totalCashbackRefunded : totalCashbackWalletReversed
        }
      }
    });

  } catch (error) {
    console.error('Error processing offer refund:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to process refund'
    });
  }
}