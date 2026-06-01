import dbConnect from "../../../lib/database";
import User from "../../../models/Users";
import Clinic from "../../../models/Clinic"; // import Clinic model
import { getUserFromReq } from "./auth";

export default async function handler(req, res) {
  await dbConnect();

  try {
    // Logged-in user
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    // Must be clinic role
    if (user.role !== "clinic") {
      return res.status(403).json({ message: "Only clinics can access this" });
    }

    // Find clinic where this user is the owner
    const clinic = await Clinic.findOne({ owner: user._id });
    if (!clinic) {
      return res.status(404).json({ message: "No clinic found for this user" });
    }

    // Fetch all agents under this clinic
    const agents = await User.find({
      clinicId: clinic._id,
      role: "agent",
    }).select("_id name email role permissions clinicId");

    res.status(200).json(agents);
  } catch (error) {
    // console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
}
