import dbConnect from "../../../lib/database";
import Room from "../../../models/Room";
import Clinic from "../../../models/Clinic";
import User from "../../../models/Users";
import { getUserFromReq } from "../lead-ms/auth";
import { getClinicIdFromUser, checkClinicPermission } from "../lead-ms/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  // Verify authentication
  let user;
  try {
    user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    // Allow clinic, doctor, agent, doctorStaff, and staff roles
    if (!["clinic", "doctor", "agent", "doctorStaff", "staff"].includes(user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  // Get clinic ID from user
  const { clinicId, error: clinicError } = await getClinicIdFromUser(user);
  if (clinicError || !clinicId) {
    return res.status(403).json({ 
      success: false,
      message: clinicError || "Unable to determine clinic access" 
    });
  }

  // GET: Fetch all rooms for this clinic
  if (req.method === "GET") {
    try {
      // Check read permission
      const { hasPermission, error: permError } = await checkClinicPermission(
        clinicId,
        "clinic_addRoom",
        "read"
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: permError || "You do not have permission to view rooms",
        });
      }

      const rooms = await Room.find({ clinicId })
        .sort({ createdAt: -1 })
        .lean();

      return res.status(200).json({
        success: true,
        rooms: rooms.map((room) => ({
          _id: room._id.toString(),
          name: room.name,
          createdAt: room.createdAt,
          updatedAt: room.updatedAt,
        })),
      });
    } catch (error) {
      console.error("Error fetching rooms:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch rooms" });
    }
  }

  // POST: Create a new room
  if (req.method === "POST") {
    try {
      // Check create permission
      const { hasPermission, error: permError } = await checkClinicPermission(
        clinicId,
        "clinic_addRoom",
        "create",
        "Add Room"
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: permError || "You do not have permission to create rooms",
        });
      }

      const { name } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: "Room name is required" });
      }

      // Check if room with same name already exists for this clinic
      const existingRoom = await Room.findOne({
        clinicId,
        name: name.trim(),
      });

      if (existingRoom) {
        return res.status(400).json({
          success: false,
          message: "A room with this name already exists",
        });
      }

      const newRoom = await Room.create({
        clinicId,
        name: name.trim(),
        createdBy: user._id,
      });

      return res.status(201).json({
        success: true,
        message: "Room created successfully",
        room: {
          _id: newRoom._id.toString(),
          name: newRoom.name,
          createdAt: newRoom.createdAt,
          updatedAt: newRoom.updatedAt,
        },
      });
    } catch (error) {
      console.error("Error creating room:", error);
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "A room with this name already exists",
        });
      }
      return res.status(500).json({ success: false, message: "Failed to create room" });
    }
  }

  // PUT: Update an existing room
  if (req.method === "PUT") {
    try {
      // Check update permission
      const { hasPermission, error: permError } = await checkClinicPermission(
        clinicId,
        "clinic_addRoom",
        "update",
        "Add Room"
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: permError || "You do not have permission to update rooms",
        });
      }

      const { roomId, name } = req.body;

      if (!roomId || !name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Room ID and new name are required",
        });
      }

      const room = await Room.findOne({ _id: roomId, clinicId });
      if (!room) {
        return res.status(404).json({ success: false, message: "Room not found" });
      }

      const normalizedName = name.trim();
      const duplicateRoom = await Room.findOne({
        clinicId,
        name: normalizedName,
        _id: { $ne: roomId },
      });

      if (duplicateRoom) {
        return res.status(400).json({
          success: false,
          message: "Another room with this name already exists",
        });
      }

      room.name = normalizedName;
      await room.save();

      return res.status(200).json({
        success: true,
        message: "Room updated successfully",
        room: {
          _id: room._id.toString(),
          name: room.name,
          createdAt: room.createdAt,
          updatedAt: room.updatedAt,
        },
      });
    } catch (error) {
      console.error("Error updating room:", error);
      return res.status(500).json({ success: false, message: "Failed to update room" });
    }
  }

  // DELETE: Delete a room
  if (req.method === "DELETE") {
    try {
      // Check delete permission
      const { hasPermission, error: permError } = await checkClinicPermission(
        clinicId,
        "clinic_addRoom",
        "delete",
        "Add Room"
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: permError || "You do not have permission to delete rooms",
        });
      }

      const { roomId } = req.query;

      if (!roomId) {
        return res.status(400).json({ success: false, message: "Room ID is required" });
      }

      // Verify the room belongs to this clinic
      const room = await Room.findOne({ _id: roomId, clinicId });
      if (!room) {
        return res.status(404).json({ success: false, message: "Room not found" });
      }

      await Room.findByIdAndDelete(roomId);

      return res.status(200).json({
        success: true,
        message: "Room deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting room:", error);
      return res.status(500).json({ success: false, message: "Failed to delete room" });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
  return res.status(405).json({ success: false, message: "Method not allowed" });
}

