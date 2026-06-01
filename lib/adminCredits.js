import AdminSmsCredit from "../models/AdminSmsCredit";

export async function getOrCreateAdminCredits() {
  let doc = await AdminSmsCredit.findOne();
  if (!doc) {
    doc = await AdminSmsCredit.create({});
  }
  return doc;
}

export async function addAdminCredits(amount, note) {
  if (amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }
  const doc = await getOrCreateAdminCredits();
  doc.availableCredits += amount;
  doc.totalAdded = (doc.totalAdded || 0) + amount;
  doc.lastTopupAt = new Date();
  doc.note = note;
  await doc.save();
  return doc;
}

export async function consumeAdminCredits(amount) {
  if (amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }
  const doc = await getOrCreateAdminCredits();
  if (doc.availableCredits < amount) {
    const error = new Error("INSUFFICIENT_ADMIN_CREDITS");
    error.code = "INSUFFICIENT_ADMIN_CREDITS";
    throw error;
  }
  doc.availableCredits -= amount;
  doc.totalConsumed = (doc.totalConsumed || 0) + amount;
  await doc.save();
  return doc;
}

export async function updateAdminLowThreshold(threshold) {
  const doc = await getOrCreateAdminCredits();
  doc.lowThreshold = threshold;
  await doc.save();
  return doc;
}

