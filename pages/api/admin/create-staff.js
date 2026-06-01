import dbConnect from "../../../lib/database";
import User from "../../../models/Users";
import {getUserFromReq , requireRole} from "../lead-ms/auth";

export default async function handler(req, res){
    await dbConnect();
    if(req.method !== "POST"){
        return res.status(405).json({success:false, message:"Method not allowed"});
    }           

    try{
        const me = await getUserFromReq(req);
        // console.log("Logged in user:", me);
        if(!me || !requireRole(me, ["admin"])){
            return res.status(403).json({success:false, error:"Access denied. Admin only"});
        }

        const {name , email , password,role} = req.body;

        if(!name || !email || !password || !role){
            return res.status(400).json({success:false, message:"Missing required fields"});
        }
          if (!["staff", "doctorStaff"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role. Allowed: staff, doctor" });
    }

       const existing = await User.findOne({ email, role });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `${role} with this email already exists`
      });
    }


         const user = new User({
      name,
      email,
      password, // make sure password is hashed in your User model pre-save
      role,
      isApproved: true,
      declined: false,
    });
    
        await user.save();

    return res.status(201).json({
      success: true,
      message: `${role} created successfully`,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });

  } catch (err) {
    // console.error("Error creating user:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}