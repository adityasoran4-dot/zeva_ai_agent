import dbConnect from '../../../lib/database';
import Enquiry from '../../../models/Enquiry';
import Review from '../../../models/Review';
import Appointment from '../../../models/Appointment';
import Blog from '../../../models/Blog';
import User from '../../../models/Users';
import { getUserFromReq } from '../lead-ms/auth';
import { getClinicIdFromUser } from '../lead-ms/permissions-helper';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const authUser = await getUserFromReq(req);
    
    if (!authUser) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Allow clinic, admin, agent, doctor, doctorStaff, and staff roles
    if (!["clinic", "admin", "agent", "doctor", "doctorStaff", "staff"].includes(authUser.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { clinicId, error, isAdmin } = await getClinicIdFromUser(authUser);
    if (error && !isAdmin) {
      return res.status(404).json({ success: false, message: error });
    }

    if (!clinicId) {
      return res.status(404).json({ success: false, message: 'Clinic not found' });
    }

    const activities = [];

    // Get recent reviews (last 10)
    const recentReviews = await Review.find({ clinicId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('rating comment createdAt')
      .lean();

    recentReviews.forEach(review => {
      const timeAgo = getTimeAgo(review.createdAt);
      activities.push({
        type: 'review',
        message: `New review received${review.rating ? ` (${review.rating}⭐)` : ''}`,
        time: timeAgo,
        icon: 'check',
        color: 'green',
        timestamp: review.createdAt,
      });
    });

    // Get recent enquiries (last 10)
    const recentEnquiries = await Enquiry.find({ clinicId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email createdAt')
      .lean();

    recentEnquiries.forEach(enquiry => {
      const timeAgo = getTimeAgo(enquiry.createdAt);
      activities.push({
        type: 'enquiry',
        message: `New enquiry from ${enquiry.name || 'patient'}`,
        time: timeAgo,
        icon: 'mail',
        color: 'blue',
        timestamp: enquiry.createdAt,
      });
    });

    // Get recent appointments (last 5)
    const recentAppointments = await Appointment.find({ clinicId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('status startDate createdAt')
      .lean();

    recentAppointments.forEach(appointment => {
      const timeAgo = getTimeAgo(appointment.createdAt);
      activities.push({
        type: 'appointment',
        message: `New appointment ${appointment.status || 'booked'}`,
        time: timeAgo,
        icon: 'calendar',
        color: 'purple',
        timestamp: appointment.createdAt,
      });
    });

    // Get recent blogs if Blog model exists
    try {
      const recentBlogs = await Blog.find({ clinicId: clinicId.toString() })
        .sort({ createdAt: -1 })
        .limit(3)
        .select('title status createdAt')
        .lean();

      recentBlogs.forEach(blog => {
        if (blog.status === 'published') {
          const timeAgo = getTimeAgo(blog.createdAt);
          activities.push({
            type: 'blog',
            message: `Blog "${blog.title?.substring(0, 30)}..." published`,
            time: timeAgo,
            icon: 'file',
            color: 'amber',
            timestamp: blog.createdAt,
          });
        }
      });
    } catch (err) {
      // Blog model might not exist or have different structure
      console.log('Blog fetch error:', err.message);
    }

    // Sort by timestamp (most recent first) and limit to 10
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const sortedActivities = activities.slice(0, 10);

    return res.status(200).json({
      success: true,
      activities: sortedActivities,
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activity',
      error: error.message,
    });
  }
}

// Helper function to calculate time ago
function getTimeAgo(date) {
  if (!date) return 'Recently';
  
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}

