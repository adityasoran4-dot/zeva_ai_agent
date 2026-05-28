import { google } from "googleapis";
import dbConnect from "../../../lib/database";
import Clinic from "../../../models/Clinic";
import { getUserFromReq } from "../lead-ms/auth";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      await dbConnect();
      const me = await getUserFromReq(req);

      if (!me) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      // ✅ Resolve clinicId based on role
      let clinic;
      if (me.role === "clinic") {
        clinic = await Clinic.findOne({ owner: me._id });
      } else if (me.role === "agent") {
        if (!me.clinicId) {
          return res.status(403).json({
            success: false,
            message: "Agent not linked to any clinic",
          });
        }
        clinic = await Clinic.findById(me.clinicId);
      } else if (me.role === "doctor") {
        if (!me.clinicId) {
          return res.status(403).json({
            success: false,
            message: "Doctor not linked to any clinic",
          });
        }
        clinic = await Clinic.findById(me.clinicId);
      } else if (me.role === "doctorStaff" || me.role === "staff") {
        if (!me.clinicId) {
          return res.status(403).json({
            success: false,
            message: "Staff not linked to any clinic",
          });
        }
        clinic = await Clinic.findById(me.clinicId);
      } else if (me.role === "admin") {
        const { clinicId: adminClinicId } = req.query;
        if (adminClinicId) {
          clinic = await Clinic.findById(adminClinicId);
        }
      }

      if (!clinic) {
        return res
          .status(404)
          .json({ success: false, message: "Clinic not found for this user" });
      }

      const scopes = [
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.readonly",
      ];

      // Create state object with clinicId
      const state = Buffer.from(
        JSON.stringify({ clinicId: clinic._id, userId: me._id }),
      ).toString("base64");

      const url = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: scopes,
        prompt: "consent",
        state: state,
      });

      return res.status(200).json({
        success: true,
        url,
      });
    } catch (error) {
      console.error("Error connecting to database:", error?.message);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  } else {
    res.status(405).end("Method Not Allowed");
  }
}
