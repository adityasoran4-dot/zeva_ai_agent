import dbConnect from '../../../lib/database';
import Treatment from '../../../models/Treatment';

export default async function handler(req, res) {
  await dbConnect();
  const { q } = req.query;

  if (!q) return res.status(400).json({ message: 'Query is required' });

  const regex = new RegExp(q, 'i');

  try {
    const treatments = await Treatment.find({
      $or: [
        { name: regex }, // main treatment
        { 'subcategories.name': regex }, // subcategories
      ],
    }).lean();

    const suggestions = [];

    treatments.forEach((treatment) => {
      // Check main name
      if (regex.test(treatment.name)) {
        suggestions.push({
          type: 'treatment',
          value: treatment.name,
        });
      }

      // Check subcategories
      (treatment.subcategories || []).forEach((sub) => {
        if (regex.test(sub.name)) {
          suggestions.push({
            type: 'subcategory',
            value: `${sub.name} (${treatment.name})`,
          });
        }
      });
    });

    return res.status(200).json({ treatments: suggestions });
  } catch (err) {
    console.error("Treatment search error:", err);
    return res.status(500).json({ message: 'Server error while fetching treatments' });
  }
}
