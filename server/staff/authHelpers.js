import jwt from "jsonwebtoken";
import User from "../../models/Users";

const DEFAULT_ALLOWED_ROLES = ["doctor", "doctorStaff", "clinic", "staff", "agent", "admin"];

export async function getAuthorizedStaffUser(req, options = {}) {
  const {
    allowedRoles = DEFAULT_ALLOWED_ROLES,
    requireActiveFor = ["doctor", "doctorStaff"],
  } = options;

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    throw { status: 401, message: "Authorization token missing" };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded?.userId || decoded?.id;

    if (!userId) {
      throw { status: 401, message: "Invalid token payload" };
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      throw { status: 401, message: "User not found" };
    }

    if (!allowedRoles.includes(user.role)) {
      throw { status: 403, message: "Access denied" };
    }

    if (requireActiveFor.includes(user.role)) {
      if (!user.isApproved || user.declined) {
        throw { status: 403, message: "Account not active" };
      }
    }

    return user;
  } catch (error) {
    if (error.status) throw error;
    throw { status: 401, message: "Invalid or expired token" };
  }
}

export const STAFF_ALLOWED_ROLES = DEFAULT_ALLOWED_ROLES;


