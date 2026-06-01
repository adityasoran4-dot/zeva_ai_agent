import dbConnect from '../../../lib/database';
import Review from '../../../models/Review';
import { verifyToken } from '../auth/verify';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'POST') {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      const decoded = await verifyToken(token); // returns full user object

      const { clinicId, rating, comment } = req.body;

      const reviewData = {
        clinicId,
        userId: decoded._id,
        rating,
      };

      if (comment && comment.trim() !== '') {
        reviewData.comment = comment.trim();
      }

      const review = await Review.create(reviewData);


      res.status(201).json(review);
    } catch (error) {
      console.error('Review creation error:', error);
      return res.status(401).json({ message: 'Unauthorized or invalid data' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
