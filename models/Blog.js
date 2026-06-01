import mongoose from "mongoose";

const replySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  username: String,
  text: String,
  createdAt: { type: Date, default: Date.now },
});

const CommentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  replies: {
    type: [replySchema],
    default: Date.now,
  },
});

const BlogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  status: { type: String, enum: ["draft", "published"], default: "draft" },
  paramlink: { type: String, required: true },
  slugLocked: { type: Boolean, default: false }, // Lock slug once published
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  role: { type: String, enum: ["clinic", "doctor"], required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [CommentSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Ensure paramlink is unique only for published blogs
BlogSchema.index(
  { paramlink: 1 },
  { unique: true, partialFilterExpression: { status: "published" } }
);

delete mongoose.models.Blog;
export default mongoose.models.Blog || mongoose.model("Blog", BlogSchema);
