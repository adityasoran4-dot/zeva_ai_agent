//pages/api/auth/request-otp.js
import dbConnect from '../../../lib/database';
import User from "../../../models/Users";
import Clinic from "../../../models/Clinic";
import bcrypt from 'bcryptjs';
import Notification from "../../../models/Notification";
import { emitNotificationToUser } from "../push-notification/socketio";
import { sendWhatsAppViaTwilio, sendEmailViaSMTP } from "../../../lib/notify/sendOtp";

export default async function handler(req, res) {
  await dbConnect();
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ success: false, message: "Email and password required" });
  const user = await User.findOne({ email }).lean();
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  const match = await bcrypt.compare(password, user.password || "");
  if (!match) return res.status(401).json({ success: false, message: "Invalid credentials" });
  if (!user.otpEnabled) return res.status(400).json({ success: false, message: "OTP not enabled" });
  const clinic = user.clinicId ? await Clinic.findById(user.clinicId).lean() : null;
  const phoneCode = String(Math.floor(1000 + Math.random() * 9000));
  const emailCode = String(Math.floor(1000 + Math.random() * 9000));
  const expires = new Date(Date.now() + 5 * 60 * 1000);
  await User.updateOne(
    { _id: user._id },
    { 
      $set: { 
        otpCode: null, 
        otpExpires: null,
        otpCodePhone: clinic?.otpWhatsAppNumber ? phoneCode : null,
        otpCodeEmail: clinic?.otpEmail ? emailCode : null,
        otpExpiresPhone: clinic?.otpWhatsAppNumber ? expires : null,
        otpExpiresEmail: clinic?.otpEmail ? expires : null
      } 
    }
  );
  try {
    if (clinic?.owner) {
      const adminId = clinic.owner.toString();
      const msg = `Login OTP for ${user.name || user.email}: Phone=${clinic?.otpWhatsAppNumber ? phoneCode : "N/A"}, Email=${clinic?.otpEmail ? emailCode : "N/A"}`;
      const notif = await Notification.create({ user: adminId, message: msg, type: "acknowledgment" });
      emitNotificationToUser(adminId, { message: msg, type: "acknowledgment", createdAt: new Date() });
    }
  } catch {}
  let whatsappSent = false;
  let emailSent = false;
  const msgTextPhone = `ZEVA OTP: ${phoneCode}\nValid 5 minutes\nDo not share this code.`;
  if (clinic?.otpWhatsAppNumber) {
    const contentSid = process.env.TWILIO_CONTENT_SID_OTP;
    let waOptions = { body: msgTextPhone };
    if (contentSid) {
      const names = String(process.env.TWILIO_OTP_VAR_NAMES || "1")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
      const vars = {};
      for (const n of names) vars[n] = phoneCode;
      waOptions = { contentSid, contentVariables: vars };
    }
    const r = await sendWhatsAppViaTwilio(clinic.otpWhatsAppNumber, waOptions);
    whatsappSent = !!r.success;
  }
  if (clinic?.otpEmail) {
    const html = `
      <div style="background:#f7f7f9;padding:24px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#111827">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
          <div style="padding:20px 24px;border-bottom:1px solid #eef2f7">
            <div style="font-weight:600;font-size:16px;display:flex;align-items:center;gap:8px;color:#111827">
              <span style="display:inline-block;padding:6px 10px;background:#eef2ff;color:#3b82f6;border-radius:8px;font-weight:600">ZEVA</span>
              OTP Verification
            </div>
            <div style="margin-top:4px;font-size:12px;color:#6b7280">Secure login verification for your account</div>
          </div>
          <div style="padding:24px">
            <div style="font-size:12px;color:#6b7280;margin-bottom:8px">Verification code</div>
            <div style="font-weight:700;letter-spacing:0.2em;font-size:28px;color:#111827;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px;text-align:center">${emailCode}</div>
            <div style="margin-top:12px;font-size:12px;color:#6b7280">Valid for 5 minutes</div>
            <div style="margin-top:16px;font-size:13px;color:#374151">
              User: <strong>${user.name || user.email}</strong><br/>
              Clinic: <strong>${clinic?.name || "Clinic"}</strong>
            </div>
            <div style="margin-top:16px;padding:12px 14px;background:#fff7ed;border:1px solid #fde68a;border-radius:10px;color:#92400e;font-size:12px">
              Do not share this code. ZEVA will never ask you for your OTP.
            </div>
          </div>
          <div style="padding:16px 24px;border-top:1px solid #eef2f7;font-size:12px;color:#6b7280">
            © ZEVA
          </div>
        </div>
      </div>`;
    const r = await sendEmailViaSMTP(clinic.otpEmail, "ZEVA OTP Verification", { text: `ZEVA • OTP: ${emailCode} | Valid 5 minutes | User: ${user.name || user.email}`, html });
    emailSent = !!r.success;
  }
  const isDev = process.env.NODE_ENV !== "production";
  return res.status(200).json({ success: true, sent: true, delivery: { notification: true, whatsapp: whatsappSent, email: emailSent }, debugPhoneOtp: isDev ? phoneCode : undefined, debugEmailOtp: isDev ? emailCode : undefined });
}