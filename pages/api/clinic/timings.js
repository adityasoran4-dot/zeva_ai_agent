// pages/api/clinic/timings.js
import dbConnect from "../../../lib/database";
import Clinic from "../../../models/Clinic";
import { getUserFromReq } from "../lead-ms/auth";
import { getClinicIdFromUser } from "../lead-ms/permissions-helper";

const VALID_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function validateTimings(timings) {
  if (!Array.isArray(timings)) return 'timings must be an array';
  for (const entry of timings) {
    if (!VALID_DAYS.includes(entry.day)) return `Invalid day: ${entry.day}`;
    if (typeof entry.isOpen !== 'boolean') return `isOpen must be boolean for ${entry.day}`;
    if (entry.isOpen) {
      if (!entry.openingTime) return `openingTime required for ${entry.day}`;
      if (!entry.closingTime) return `closingTime required for ${entry.day}`;
    }
  }
  return null;
}

export default async function handler(req, res) {
  await dbConnect();

  let me;
  try {
    me = await getUserFromReq(req);
    if (!me) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!['clinic', 'admin', 'staff'].includes(me.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  let clinicId;
  try {
    if (me.role === 'admin') {
      clinicId = req.query.clinicId || req.body?.clinicId;
      if (!clinicId) return res.status(400).json({ success: false, message: 'clinicId required for admin' });
    } else {
      const resolved = await getClinicIdFromUser(me);
      clinicId = resolved.clinicId;
      if (resolved.error || !clinicId) {
        return res.status(403).json({ success: false, message: resolved.error || 'No clinic access' });
      }
    }
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to resolve clinic' });
  }

  // ─── GET: Fetch clinic timings ──────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const clinic = await Clinic.findById(clinicId).select('timings').lean();
      if (!clinic) return res.status(404).json({ success: false, message: 'Clinic not found' });

      // If no timings stored yet, return default structure
      const timings = clinic.timings && clinic.timings.length > 0
        ? clinic.timings
        : VALID_DAYS.map((day) => ({
            day,
            isOpen: ['Monday', 'Tuesday'].includes(day),
            openingTime: '09:00 AM',
            closingTime: '06:00 PM',
            breakStart: '01:00 PM',
            breakEnd: '02:00 PM',
          }));

      return res.status(200).json({ success: true, timings });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // ─── PUT: Save / update clinic timings ─────────────────────────────────
  if (req.method === 'PUT') {
    try {
      const { timings, applyMondayToAll } = req.body;

      if (!timings) return res.status(400).json({ success: false, message: 'timings is required' });

      let finalTimings = [...timings];

      // "Apply Monday to All" — copy Monday schedule to every open day
      if (applyMondayToAll) {
        const monday = finalTimings.find((t) => t.day === 'Monday');
        if (monday) {
          finalTimings = VALID_DAYS.map((day) => {
            const existing = finalTimings.find((t) => t.day === day);
            return {
              day,
              isOpen: existing?.isOpen ?? false,
              openingTime: monday.openingTime,
              closingTime: monday.closingTime,
              breakStart: monday.breakStart,
              breakEnd: monday.breakEnd,
            };
          });
        }
      }

      // Validate
      const validationError = validateTimings(finalTimings);
      if (validationError) return res.status(400).json({ success: false, message: validationError });

      // Ensure all 7 days present, fill any missing with defaults
      const timingMap = {};
      finalTimings.forEach((t) => { timingMap[t.day] = t; });
      const completeTimings = VALID_DAYS.map((day) => timingMap[day] || {
        day,
        isOpen: false,
        openingTime: '09:00 AM',
        closingTime: '06:00 PM',
        breakStart: '01:00 PM',
        breakEnd: '02:00 PM',
      });

      const updated = await Clinic.findByIdAndUpdate(
        clinicId,
        { $set: { timings: completeTimings } },
        { new: true, runValidators: true }
      ).select('timings').lean();

      if (!updated) return res.status(404).json({ success: false, message: 'Clinic not found' });

      return res.status(200).json({ success: true, message: 'Timings saved successfully', timings: updated.timings });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  return res.status(405).json({ success: false, message: `Method ${req.method} not allowed` });
}
