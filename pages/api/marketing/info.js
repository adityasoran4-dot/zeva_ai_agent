// /pages/api/info.ts
import dbConnect from "../../../lib/database";
import InfoClick from "../../../models/InfoClick";
import mongoose from "mongoose";

export default async function handler(req, res) {
  try {
    await dbConnect();

    const { phone, type, id } = req.query;

    if (!phone || !type || !id) return res.status(400).send("Missing parameters");
    if (!["doctor", "clinic"].includes(type)) return res.status(400).send("Invalid type");
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).send("Invalid ID");

    // Save the click in InfoClick
    await InfoClick.create({ phone, userType: type, userId: id });

    // Redirect to appropriate page
    const redirectUrl = type === "doctor" ? `/doctors/${id}` : `/clinics/${id}`;
    return res.redirect(redirectUrl);
  } catch (err) {
    // console.error(err);
    return res.status(500).send("Server error");
  }
}
