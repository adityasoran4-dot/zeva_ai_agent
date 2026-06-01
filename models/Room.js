import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Ensure unique room names per clinic
RoomSchema.index({ clinicId: 1, name: 1 }, { unique: true });

export default mongoose.models.Room || mongoose.model("Room", RoomSchema);

