// pages/api/admin/jobs/manage.ts
import dbConnect from '../../../lib/database';
import JobPosting from '../../../models/JobPosting';
import { getUserFromReq } from '../lead-ms/auth';
import { checkAgentPermission } from '../agent/permissions-helper';

export default async function handler(req, res) {
  await dbConnect();
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try { 
    // Get the logged-in user
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ message: 'Unauthorized: Missing or invalid token' });
    }
    
    // Check permissions for agents - admins bypass all checks
    if (me.role === 'agent' || me.role === 'doctorStaff') {
      const { hasPermission } = await checkAgentPermission(me._id, "admin_manage_job", "read");
      if (!hasPermission) {
        return res.status(403).json({ 
          message: "Permission denied: You do not have read permission for manage job module" 
        });
      }
    } else if (me.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin or agent role required' });
    }

    // Get filter parameters from query
    const { search, jobType, location, department, salaryMin, salaryMax, page, limit, status } = req.query;
    
    // Pagination parameters
    const pageNumber = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 9; // Default 9 items per page
    const skip = (pageNumber - 1) * pageSize;
    const requestedStatus = status || null; // If status is provided, only paginate that status
    
    // console.log('🔍 API called with filters:', { search, jobType, location, department, salaryMin, salaryMax });

    // Build filter object for each status
    const buildFilter = (status) => {
      const filter = { status };
      
      // Search filter (jobTitle, companyName, department)
      if (search?.trim()) {
        filter.$or = [
          { jobTitle: { $regex: search.trim(), $options: 'i' } },
          { companyName: { $regex: search.trim(), $options: 'i' } },
          { department: { $regex: search.trim(), $options: 'i' } }
        ];
      }
      
      // Job Type filter
      if (jobType?.trim()) {
        filter.jobType = jobType.trim();
      }
      
      // Location filter
      if (location?.trim()) {
        filter.location = { $regex: location.trim(), $options: 'i' };
      }
      
      // Department filter
      if (department?.trim()) {
        filter.department = { $regex: department.trim(), $options: 'i' };
      }
      
      return filter;
    };

    // Apply salary filter helper
    const filterBySalary = (jobs) => {
      if (!salaryMin && !salaryMax) return jobs;
      
      const min = salaryMin ? parseInt(salaryMin) : 0;
      const max = salaryMax ? parseInt(salaryMax) : Infinity;
      
      return jobs.filter(job => {
        if (!job.salary) return false;
        const salaryStr = job.salary.toLowerCase().replace(/[^0-9.-]/g, '');
        const salaryNum = parseInt(salaryStr) || 0;
        return salaryNum >= min && salaryNum <= max;
      });
    };

    // If status is provided, only fetch and paginate that status
    if (requestedStatus) {
      const allJobsForStatus = await JobPosting.find(buildFilter(requestedStatus))
        .populate('postedBy', 'name email role')
        .select('+slug +slugLocked')
        .sort({ createdAt: -1 });
      
      const salaryFiltered = filterBySalary(allJobsForStatus);
      const totalCount = salaryFiltered.length;
      const paginatedJobs = salaryFiltered.slice(skip, skip + pageSize);
      
      const result = {
        pending: requestedStatus === 'pending' ? paginatedJobs : [],
        approved: requestedStatus === 'approved' ? paginatedJobs : [],
        declined: requestedStatus === 'declined' ? paginatedJobs : [],
      };
      
      return res.status(200).json({
        success: true,
        ...result,
        pagination: {
          currentPage: pageNumber,
          totalPages: Math.ceil(totalCount / pageSize),
          totalJobs: totalCount,
          limit: pageSize
        }
      });
    }

    // Fetch all jobs grouped by status with filters (no pagination when all statuses requested)
    const pendingJobs = await JobPosting.find(buildFilter('pending')).populate('postedBy', 'name email role').select('+slug +slugLocked');
    const approvedJobs = await JobPosting.find(buildFilter('approved')).populate('postedBy', 'name email role').select('+slug +slugLocked');
    const declinedJobs = await JobPosting.find(buildFilter('declined')).populate('postedBy', 'name email role').select('+slug +slugLocked');

    const filteredPending = filterBySalary(pendingJobs);
    const filteredApproved = filterBySalary(approvedJobs);
    const filteredDeclined = filterBySalary(declinedJobs);

    res.status(200).json({
      success: true,
      pending: filteredPending,
      approved: filteredApproved,
      declined: filteredDeclined,
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token', error: error.message });
  }
}
