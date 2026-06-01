// pages/api/clinics/registerOwner.js
import dbConnect from "../../../lib/database";
import User from "../../../models/Users";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === "POST") {
    try {
      const { name, phone, email, password } = req.body;

      if (!name || !phone || !email || !password) {
        return res.status(400).json({
          success: false,
          message: "All fields (name, phone, email, password) are required",
        });
      }

      const existingUser = await User.findOne({ email, role: 'clinic' });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email already registered",
        });
      }

      const user = new User({
        name: name.trim(),
        phone: phone.trim(),
        email: email.toLowerCase().trim(),
        password,
        role: "clinic", // ✅ this sets the role
      });

      const savedUser = await user.save();

      return res.status(201).json({
        success: true,
        message: "Clinic user registered successfully",
        user: {
          id: savedUser._id,
          name: savedUser.name,
          email: savedUser.email,
          role: savedUser.role,
        },
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: err.message,
      });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    return res
      .status(405)
      .json({ message: `Method ${req.method} not allowed` });
  }
}
