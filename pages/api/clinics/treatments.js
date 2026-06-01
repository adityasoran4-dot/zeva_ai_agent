// File: pages/api/clinics/treatments.ts or app/api/clinics/treatments/route.ts

// import mongoose from 'mongoose';
import dbConnect from '../../../lib/database';
import Treatment from '../../../models/Treatment';

export default async function handler(req, res) {
  await dbConnect();

  try {
    const treatments = await Treatment.find({}, "name slug"); // only main treatments
    const formatted = treatments.map((t) => ({
      name: t.name,
      slug: t.slug,
    }));
    res.status(200).json({ success: true, treatments: formatted });
  } catch {
    res.status(500).json({ success: false, message: "Error fetching treatments" });
  }
}