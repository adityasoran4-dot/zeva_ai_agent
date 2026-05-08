// pages/api/clinics/search.ts
import dbConnect from '../../../lib/database';
import Clinic from '../../../models/Clinic';

export default async function handler(req, res) {
  await dbConnect();
  const { q } = req.query;

  if (!q) return res.status(400).json({ message: 'Query is required' });

  const regex = new RegExp(q, 'i'); // case-insensitive search

  const clinics = await Clinic.find({ 
    name: { $regex: regex, $not: /zeva/i } // Exclude Zeva clinics
  })
    .select('name address treatments pricing timings photos location slug slugLocked')
    .limit(10)
    .lean();

  res.status(200).json({ success: true, clinics });
}
