// /pages/api/get-agents
import dbConnect from '../../../lib/database';
import User from '../../../models/Users';
import Clinic from '../../../models/Clinic';   // ✅ import Clinic
import AgentProfile from '../../../models/AgentProfile'; // ✅ import AgentProfile
import bcrypt from 'bcryptjs';
import { getUserFromReq, requireRole } from './auth';
import { checkClinicPermission } from './permissions-helper';
import { checkAgentPermission } from '../agent/permissions-helper';
import {WorkSession} from '../../../models/WorkSession';

export default async function handler(req, res) {
  await dbConnect();

  const me = await getUserFromReq(req);
  if (!me) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
  }

  // Allow admin, clinic, doctor, agent, and doctorStaff roles
  if (!requireRole(me, ['admin', 'clinic', 'doctor', 'agent', 'doctorStaff'])) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  // ---------------- GET Agents/DoctorStaff ----------------
  if (req.method === 'GET') {
    // ✅ Check permissions for reading agents (admin bypasses all checks)
    // If agentId is provided, we skip the broad "create_agent" permission check 
    // and rely on specific scope checks below.
    if (me.role !== 'admin' && !req.query.agentId) {
      // For clinic role: Check clinic permissions
      if (me.role === 'clinic') {
        const clinic = await Clinic.findOne({ owner: me._id });
        if (clinic) {
          const { hasPermission: clinicHasPermission, error: clinicError } = await checkClinicPermission(
            clinic._id,
            "create_agent",
            "read"
          );
          if (!clinicHasPermission) {
            return res.status(403).json({
              success: false,
              message: clinicError || "You do not have permission to view agents"
            });
          }
        }
      }
      // For agent role (agentToken): Check agent permissions
      else if (me.role === 'agent') {
        const { hasPermission: agentHasPermission, error: agentError } = await checkAgentPermission(
          me._id,
          "create_agent",
          "read"
        );
        if (!agentHasPermission) {
          return res.status(403).json({
            success: false,
            message: agentError || "You do not have permission to view agents"
          });
        }
      }
      // For doctorStaff role (userToken): Check agent permissions
      else if (me.role === 'doctorStaff') {
        const { hasPermission: agentHasPermission, error: agentError } = await checkAgentPermission(
          me._id,
          "create_agent",
          "read"
        );
        if (!agentHasPermission) {
          return res.status(403).json({
            success: false,
            message: agentError || "You do not have permission to view agents"
          });
        }
      }
    }
    try {
      // Get role filter from query parameter (optional: 'agent', 'doctorStaff', or undefined for both)
      const roleFilter = req.query.role;
      
      // Build role query
      let roleQuery;
      if (roleFilter === 'agent') {
        roleQuery = { role: 'agent' };
      } else if (roleFilter === 'doctorStaff') {
        roleQuery = { role: 'doctorStaff' };
      } else {
        // If no role specified, default to agent (for backward compatibility)
        roleQuery = { role: 'agent' };
      }

      let query = {};

      // Filter based on who is requesting - STRICT: only show records created by the current user
      if (me.role === 'admin') {
        // Admin sees ONLY agents/doctorStaff they created
        query = { ...roleQuery, createdBy: me._id };
      } else if (me.role === 'clinic') {
        // Clinics should only see members assigned to their clinic
        const clinic = await Clinic.findOne({ owner: me._id });

        if (!clinic) {
          query = { ...roleQuery, createdBy: me._id };
        } else {
          if (roleFilter === 'doctorStaff') {
            query = { role: 'doctorStaff', clinicId: clinic._id };
          } else if (roleFilter === 'agent') {
            query = { role: 'agent', clinicId: clinic._id };
          } else {
            query = { role: 'agent', clinicId: clinic._id };
          }
        }
      } else if (me.role === 'doctor') {
        // Doctor sees agents from their clinic (if they have one) OR agents they created
        // For doctorStaff, they can ONLY see ones they created (strict filtering by createdBy)
        if (roleFilter === 'agent') {
          // Only agents
          if (me.clinicId) {
            query = {
              role: 'agent',
              $or: [
                { clinicId: me.clinicId },
                { createdBy: me._id }
              ]
            };
          } else {
            query = { role: 'agent', createdBy: me._id };
          }
        } else if (roleFilter === 'doctorStaff') {
          // Only doctorStaff - STRICT: doctor can ONLY see ones they created
          query = { role: 'doctorStaff', createdBy: me._id };
        } else {
          // Default to agent if no role filter
          if (me.clinicId) {
            query = {
              role: 'agent',
              $or: [
                { clinicId: me.clinicId },
                { createdBy: me._id }
              ]
            };
          } else {
            query = { role: 'agent', createdBy: me._id };
          }
        }
      } else if (me.role === 'agent') {
        // Agent sees only agents/doctorStaff from their clinic
        if (!me.clinicId) {
          // If agent has no clinicId, return empty
          return res.status(200).json({ success: true, agents: [] });
        }
        // Filter by clinicId and respect the roleFilter
        if (roleFilter === 'doctorStaff') {
          query = { clinicId: me.clinicId, role: 'doctorStaff' };
        } else {
          // Default to agent role (for backward compatibility and when roleFilter is 'agent')
          query = { clinicId: me.clinicId, role: 'agent' };
        }
      } else if (me.role === 'doctorStaff') {
        // Doctor staff should mirror doctor visibility but scoped to their clinic/creations
        if (roleFilter === 'doctorStaff') {
          if (me.clinicId) {
            query = {
              role: 'doctorStaff',
              $or: [
                { clinicId: me.clinicId },
                { createdBy: me._id }
              ]
            };
          } else {
            query = { role: 'doctorStaff', createdBy: me._id };
          }
        } else {
          // Default/agent view: restrict to their clinic or creations
          if (me.clinicId) {
            query = {
              role: 'agent',
              clinicId: me.clinicId
            };
          } else {
            query = { role: 'agent', createdBy: me._id };
          }
        }
      }

      // If agentId is provided, fetch single agent with profile (role-agnostic) + scope checks
      if (req.query.agentId) {
        const user = await User.findById(req.query.agentId).select('-password');
        if (!user) {
          return res.status(404).json({ success: false, message: 'Agent not found' });
        }

        // Scope checks consistent with list filters
        if (me.role === 'admin') {
          if (user.createdBy?.toString() !== me._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied for this user' });
          }
        } else if (me.role === 'clinic') {
          const clinic = await Clinic.findOne({ owner: me._id });
          const isOwnProfile = user._id.toString() === me._id.toString();
          const inSameClinic = clinic && user.clinicId?.toString() === clinic._id.toString();
          const isCreator = user.createdBy?.toString() === me._id.toString();

          if (!isOwnProfile && !inSameClinic && !isCreator) {
            return res.status(403).json({ success: false, message: 'Access denied for this user' });
          }
        } else if (me.role === 'doctor') {
          const allowed =
            (user.role === 'doctorStaff' && user.createdBy?.toString() === me._id.toString()) ||
            (user.role === 'agent' && (me.clinicId && user.clinicId?.toString() === me.clinicId.toString() || user.createdBy?.toString() === me._id.toString()));
          if (!allowed) {
            return res.status(403).json({ success: false, message: 'Access denied for this user' });
          }
        } else if (me.role === 'agent') {
          // Allow fetching their own profile OR any agent/doctorStaff in their clinic
          const isOwnProfile = user._id.toString() === me._id.toString();
          const inSameClinic = me.clinicId && user.clinicId?.toString() === me.clinicId.toString();
          
          if (!isOwnProfile && !inSameClinic) {
            return res.status(403).json({ success: false, message: 'Access denied for this user' });
          }
        } else if (me.role === 'doctorStaff') {
          // Allow fetching their own profile OR any agent/doctorStaff in their clinic
          const isOwnProfile = user._id.toString() === me._id.toString();
          const inSameClinic = me.clinicId && user.clinicId?.toString() === me.clinicId.toString();

          if (!isOwnProfile && !inSameClinic) {
            return res.status(403).json({ success: false, message: 'Access denied for this user' });
          }
        }

        const profile = await AgentProfile.findOne({ userId: user._id });
        return res.status(200).json({
          success: true,
          agent: user,
          profile: profile || {}
        });
      }

      // Debug: Log the query and user info
      // console.log('GET Agents Query:', JSON.stringify(query, null, 2));
      // console.log('Current User:', { role: me.role, _id: me._id.toString() });

      const users = await User.find(query).select('_id name email phone isApproved declined clinicId createdBy role');

      // Debug: Log results
      // console.log('Found users:', users.length);
      if (users.length > 0) {
        // console.log('Sample user:', {
        //   name: users[0].name,
        //   role: users[0].role,
        //   clinicId: users[0].clinicId?.toString(),
        //   createdBy: users[0].createdBy?.toString()
        // });
      }

      return res.status(200).json({ success: true, agents: users });
    } catch (err) {
      // console.error('Error fetching users:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch users', error: err.message });
    }
  }

  // ---------------- PATCH Approve/Decline/Reset Password ----------------
  if (req.method === 'PATCH') {
    const { agentId, action, newPassword } = req.body;

    if (!agentId || typeof agentId !== 'string') {
      return res.status(400).json({ success: false, message: 'agentId is required and must be a string' });
    }
    if (!action || !['approve', 'decline', 'resetPassword', 'updateProfile'].includes(action)) {
      return res.status(400).json({ success: false, message: 'action must be either "approve", "decline", "resetPassword" or "updateProfile"' });
    }

    // ✅ Check permissions for updating agents (admin bypasses all checks)
    if (me.role !== 'admin') {
      let requiredAction = 'update';
      if (action === 'approve' || action === 'decline') {
        requiredAction = 'approve';
      } else if (action === 'resetPassword' || action === 'updateProfile') {
        requiredAction = 'update';
      }

      // For clinic role: Check clinic permissions
      if (me.role === 'clinic') {
        const clinic = await Clinic.findOne({ owner: me._id });
        if (clinic) {
          const { hasPermission: clinicHasPermission, error: clinicError } = await checkClinicPermission(
            clinic._id,
            "create_agent",
            requiredAction
          );
          if (!clinicHasPermission) {
            return res.status(403).json({
              success: false,
              message: clinicError || `You do not have permission to ${requiredAction} agents`
            });
          }
        }
      }
      // For agent role (agentToken): Check agent permissions
      else if (me.role === 'agent') {
        const { hasPermission: agentHasPermission, error: agentError } = await checkAgentPermission(
          me._id,
          "create_agent",
          requiredAction
        );
        if (!agentHasPermission) {
          return res.status(403).json({
            success: false,
            message: agentError || `You do not have permission to ${requiredAction} agents`
          });
        }
      }
      // For doctorStaff role (userToken): Check agent permissions
      else if (me.role === 'doctorStaff') {
        const { hasPermission: agentHasPermission, error: agentError } = await checkAgentPermission(
          me._id,
          "create_agent",
          requiredAction
        );
        if (!agentHasPermission) {
          return res.status(403).json({
            success: false,
            message: agentError || `You do not have permission to ${requiredAction} agents`
          });
        }
      }
    }

    // Build query to find agent or doctorStaff based on who is requesting
    // STRICT: Only allow modification of records created by the current user (or agents from clinic)
    let agentQuery = { _id: agentId, role: { $in: ['agent', 'doctorStaff'] } };

    if (me.role === 'admin') {
      // Admin can only modify agents/doctorStaff they created
      agentQuery.createdBy = me._id;
    } else if (me.role === 'clinic') {
      // Clinic can modify agents from their clinic OR agents they created
      // For doctorStaff, they can ONLY modify ones they created
      const clinic = await Clinic.findOne({ owner: me._id });
      if (clinic) {
        agentQuery.$or = [
          { role: 'agent', clinicId: clinic._id },
          { createdBy: me._id }
        ];
      } else {
        agentQuery.createdBy = me._id;
      }
    } else if (me.role === 'doctor') {
      // Doctor can modify agents from their clinic OR agents they created
      // For doctorStaff, they can ONLY modify ones they created
      if (me.clinicId) {
        agentQuery.$or = [
          { role: 'agent', clinicId: me.clinicId },
          { createdBy: me._id }
        ];
      } else {
        agentQuery.createdBy = me._id;
      }
    } else if (me.role === 'agent') {
      // Agent can only modify agents from their clinic (not doctorStaff)
      if (me.clinicId) {
        agentQuery.clinicId = me.clinicId;
        agentQuery.role = 'agent'; // Agents can't modify doctorStaff
      } else {
        return res.status(403).json({ success: false, message: 'Agent has no clinic assigned' });
      }
    }

    const agent = await User.findOne(agentQuery);
    if (!agent) {
      return res.status(404).json({ success: false, message: 'User not found or you do not have permission to modify this user' });
    }

    let updatedProfile = null;

    if (action === 'approve') {
      agent.isApproved = true;
      agent.declined = false;
    } else if (action === 'decline') {
      agent.isApproved = false;
      agent.declined = true;
    } else if (action === 'resetPassword') {
      if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Valid newPassword (min 6 chars) is required' });
      }
      // Hash the password before saving
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      agent.password = hashedPassword;
      agent.passwordChangedAt = new Date();
    } else if (action === 'updateProfile') {
      const {
        name, email, phone, // User fields
        agentCode, emergencyPhone, relativePhone, idType, idNumber, idDocumentUrl,
        idDocumentFrontUrl, idDocumentBackUrl,
        passportNumber, passportDocumentUrl, passportDocumentFrontUrl, passportDocumentBackUrl,
        contractUrl, contractFrontUrl, contractBackUrl, contractType, baseSalary, commissionType, commissionPercentage,
        emergencyName, employeeVisaFrontUrl, employeeVisaBackUrl,
        targetMultiplier, targetAmount,
        joiningDate, isActive,
        discountType, discountAmount,
        otherDocuments,
        bankPermissions
      } = req.body;

      const clean = (s) =>
        typeof s === 'string'
          ? s.trim().replace(/^`+|`+$/g, '').replace(/^"+|"+$/g, '').replace(/^'+|'+$/g, '')
          : s;

      // Update User fields
      if (name) agent.name = name;
      if (email) agent.email = email;
      if (phone !== undefined) agent.phone = phone;

      // Update AgentProfile
      let profile = await AgentProfile.findOne({ userId: agent._id });
      if (!profile) {
        // console.log('API: Creating new profile for user:', agent._id);
        profile = new AgentProfile({ userId: agent._id });
      } else {
        // console.log('API: Found existing profile for user:', agent._id);
      }

      // console.log('API: Raw req.body.discountType:', req.body.discountType);
      // console.log('API: Raw req.body.discountAmount:', req.body.discountAmount);

      if (profile.agentCode == null) {
        profile.agentCode = `USR-${agent._id.toString()}`;
      }

      if (agentCode !== undefined) profile.agentCode = agentCode;
      if (emergencyPhone !== undefined) profile.emergencyPhone = emergencyPhone;
      if (relativePhone !== undefined) profile.relativePhone = relativePhone;
      if (idType !== undefined) profile.idType = idType;
      if (idNumber !== undefined) profile.idNumber = idNumber;
      if (idDocumentUrl !== undefined) profile.idDocumentUrl = clean(idDocumentUrl);
      if (idDocumentFrontUrl !== undefined) profile.idDocumentFrontUrl = clean(idDocumentFrontUrl);
      if (idDocumentBackUrl !== undefined) profile.idDocumentBackUrl = clean(idDocumentBackUrl);
      if (passportNumber !== undefined) profile.passportNumber = passportNumber;
      if (passportDocumentUrl !== undefined) profile.passportDocumentUrl = clean(passportDocumentUrl);
      if (passportDocumentFrontUrl !== undefined) profile.passportDocumentFrontUrl = clean(passportDocumentFrontUrl);
      if (passportDocumentBackUrl !== undefined) profile.passportDocumentBackUrl = clean(passportDocumentBackUrl);
      if (contractUrl !== undefined) profile.contractUrl = clean(contractUrl);
      if (contractFrontUrl !== undefined) profile.contractFrontUrl = clean(contractFrontUrl);
      if (contractBackUrl !== undefined) profile.contractBackUrl = clean(contractBackUrl);
      if (contractType !== undefined) profile.contractType = contractType;
      if (baseSalary !== undefined) profile.baseSalary = baseSalary;
      if (commissionType !== undefined) profile.commissionType = commissionType;
      if (commissionPercentage !== undefined) profile.commissionPercentage = commissionPercentage;
      if (targetMultiplier !== undefined) profile.targetMultiplier = targetMultiplier;
      // Compute target amount server-side for consistency if applicable
      const isTargetType = profile.commissionType === 'target_based' || profile.commissionType === 'target_plus_expense';
      if (isTargetType) {
        const base = typeof profile.baseSalary === 'number' ? profile.baseSalary : parseFloat(profile.baseSalary || '0');
        const mult = typeof profile.targetMultiplier === 'number' ? profile.targetMultiplier : parseFloat(profile.targetMultiplier || '1');
        profile.targetAmount = base * mult;
      } else if (targetAmount !== undefined) {
        profile.targetAmount = targetAmount;
      }
      if (emergencyName !== undefined) profile.emergencyName = emergencyName;
      if (joiningDate !== undefined) profile.joiningDate = joiningDate;
      if (isActive !== undefined) profile.isActive = isActive;
      
      if (employeeVisaFrontUrl !== undefined) profile.employeeVisaFrontUrl = clean(employeeVisaFrontUrl);
      if (employeeVisaBackUrl !== undefined) profile.employeeVisaBackUrl = clean(employeeVisaBackUrl);
      if (otherDocuments !== undefined) {
        profile.otherDocuments = Array.isArray(otherDocuments)
          ? otherDocuments
              .filter(d => d && typeof d.name === 'string' && typeof d.url === 'string')
              .map(d => ({ name: d.name.trim(), url: clean(d.url) }))
          : [];
      }

      // Explicitly set discount fields to ensure they are saved even if schema is cached
      if (discountType !== undefined) profile.set('discountType', discountType, { strict: false });
      if (discountAmount !== undefined) profile.set('discountAmount', discountAmount, { strict: false });

      // Explicitly set bankPermissions
      if (bankPermissions) {
        profile.set('bankPermissions', bankPermissions, { strict: false });
      }

      // console.log('API: Before profile.save(), profile data:', JSON.stringify(profile, null, 2));
      await profile.save();
      // console.log('API: After profile.save(), profile data:', JSON.stringify(profile, null, 2));
      updatedProfile = profile;
    }

    try {
      await agent.save();
      return res.status(200).json({ success: true, agent, profile: updatedProfile });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to update agent status', error: err.message });
    }
  }

  return res.status(405).json({
    success: false,
    message: `Method ${req.method} not allowed. Only GET and PATCH are supported.`,
  });
}
