import SmsWallet from "../models/SmsWallet";
import SmsWalletLog from "../models/SmsWalletLog";

export async function getOrCreateWallet(ownerId, ownerType) {
  if (!ownerId || !ownerType) {
    throw new Error("ownerId and ownerType are required");
  }

  let wallet = await SmsWallet.findOne({ ownerId, ownerType });
  if (!wallet) {
    wallet = await SmsWallet.create({ ownerId, ownerType });
  }
  return wallet;
}

export async function creditWallet({ ownerId, ownerType, amount, reason = "manual_credit", meta }) {
  if (amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }
  const wallet = await getOrCreateWallet(ownerId, ownerType);
  wallet.balance += amount;
  wallet.totalPurchased = (wallet.totalPurchased || 0) + amount;
  wallet.lastTopupAt = new Date();
  await wallet.save();
  await SmsWalletLog.create({
    walletId: wallet._id,
    ownerId,
    ownerType,
    direction: "credit",
    amount,
    reason,
    meta,
  });
  return wallet;
}

export async function debitWallet({ ownerId, ownerType, amount, reason = "sms_send", meta }) {
  if (amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }
  const wallet = await getOrCreateWallet(ownerId, ownerType);
  if (wallet.balance < amount) {
    throw new Error("INSUFFICIENT_BALANCE");
  }
  wallet.balance -= amount;
  wallet.totalSent = (wallet.totalSent || 0) + amount;
  
  // Check for low balance and update notification timestamp if needed
  const lowBalanceThreshold = parseInt(process.env.SMS_LOW_BALANCE_THRESHOLD || "20", 10);
  if (wallet.balance <= lowBalanceThreshold && (!wallet.lowBalanceNotifiedAt || 
      (Date.now() - new Date(wallet.lowBalanceNotifiedAt).getTime()) > 24 * 60 * 60 * 1000)) {
    wallet.lowBalanceNotifiedAt = new Date();
  }
  
  await wallet.save();
  await SmsWalletLog.create({
    walletId: wallet._id,
    ownerId,
    ownerType,
    direction: "debit",
    amount,
    reason,
    meta,
  });
  return wallet;
}

