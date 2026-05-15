import dbConnect from "../../../lib/database";
import Clinic from "../../../models/Clinic";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import { getUserFromReq, requireRole } from "../lead-ms/auth";

// Configure multer for file upload (photos + documents)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = path.join(process.cwd(), "public/uploads/clinic");
    if (file.fieldname === "documents") {
      uploadPath = path.join(process.cwd(), "public/uploads/clinic/documents");
    }
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const base =
      file.fieldname === "documents" ? "doc-" : "clinic-";
    cb(null, base + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;
    if (file.fieldname === "photos") {
      const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png"];
      const allowedExtensions = /jpeg|jpg|png/;
      const extname = allowedExtensions.test(ext);
      const mimetype = allowedMimeTypes.includes(mime);
      if (mimetype && extname) return cb(null, true);
      return cb(
        new Error(
          `File type "${mime}" is not allowed for photos. Only JPG and PNG formats are allowed.`
        )
      );
    }
    if (file.fieldname === "documents") {
      const allowedDocMimes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "text/plain",
      ];
      const allowedDocExt = /pdf|doc|docx|jpeg|jpg|png|txt/;
      const extname = allowedDocExt.test(ext.replace(".", ""));
      const mimetype = allowedDocMimes.includes(mime);
      if (mimetype && extname) return cb(null, true);
      return cb(
        new Error(
          `File type "${mime}" is not allowed for documents. Allowed: PDF, DOC, DOCX, JPG, PNG, TXT.`
        )
      );
    }
    return cb(new Error("Unexpected upload field"));
  },
});

// Helper function to run middleware
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

// Helper to get base URL
function getBaseUrl() {
  if (process.env.NODE_ENV === "production") {
    return "https://zeva360.com";
  }
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
}

export default async function handler(req, res) {
  await dbConnect();

  const {
    query: { id },
    method,
  } = req;

  let me = null;
  try {
    me = await getUserFromReq(req);
  } catch (err) {
    me = null;
  }

  if (method !== "GET") {
    if (!me) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    // Allow clinic, admin, agent, doctor, doctorStaff, and staff roles
    if (!["clinic", "admin", "agent", "doctor", "doctorStaff", "staff"].includes(me.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
  }

  // GET - Fetch clinic by ID
  if (method === "GET") {
    try {
      // ✅ Resolve clinicId for permission check
      if (me) {
        let clinicId;
        if (me.role === "clinic") {
          const clinic = await Clinic.findOne({ owner: me._id }).select("_id");
          if (!clinic) {
            return res.status(404).json({ success: false, message: "Clinic not found for this user" });
          }
          clinicId = clinic._id;
        } else if (me.role === "admin") {
          clinicId = id;
        } else if (["agent", "doctor", "doctorStaff", "staff"].includes(me.role)) {
          // For agent, doctor, doctorStaff, and staff, use their clinicId
          if (!me.clinicId) {
            return res.status(403).json({ success: false, message: "User not linked to a clinic" });
          }
          clinicId = me.clinicId;
          // Verify they're accessing their own clinic
          if (clinicId.toString() !== id.toString()) {
            return res.status(403).json({ success: false, message: "Access denied" });
          }
        }

        // ✅ Check permission for reading clinic (only for agent, doctorStaff roles)
        // Clinic, doctor, and staff roles have full access by default, admin bypasses
        if (me.role !== "admin" && clinicId && ["agent", "doctorStaff"].includes(me.role)) {
          const { checkAgentPermission } = await import("../agent/permissions-helper");
          const result = await checkAgentPermission(
            me._id,
            "clinic_health_center",
            "read"
          );

          if (!result.hasPermission) {
            return res.status(403).json({
              success: false,
              message: result.error || "You do not have permission to view clinic information"
            });
          }
        }
      }
      if (me && me.role === "clinic") {
        const clinic = await Clinic.findOne({ owner: me._id }).select("_id");
        if (!clinic) {
          return res.status(404).json({ success: false, message: "Clinic not found for this user" });
        }
        clinicId = clinic._id;
      } else if (me && me.role === "admin") {
        // Admin can view any clinic, use the ID from URL
        clinicId = id;
      } else if (me && ["agent", "doctor", "doctorStaff", "staff"].includes(me.role)) {
        // For agent, doctor, doctorStaff, and staff, use their clinicId
        if (!me.clinicId) {
          return res.status(403).json({ success: false, message: "User not linked to a clinic" });
        }
        clinicId = me.clinicId;
        // Verify they're accessing their own clinic
        if (clinicId.toString() !== id.toString()) {
          return res.status(403).json({ success: false, message: "Access denied" });
        }
      }

      // ✅ Check permission for reading clinic (only for agent, doctorStaff, staff roles)
      // Clinic and doctor roles have full access by default, admin bypasses
      if (me && me.role !== "admin" && clinicId && ["agent", "staff", "doctorStaff"].includes(me.role)) {
        const { checkAgentPermission } = await import("../agent/permissions-helper");
        const result = await checkAgentPermission(
          me._id,
          "clinic_health_center",
          "read"
        );

        if (!result.hasPermission) {
          return res.status(403).json({
            success: false,
            message: result.error || "You do not have permission to view clinic information"
          });
        }
      }

      const clinic = await Clinic.findById(id).lean();

      if (!clinic) {
        return res.status(404).json({ success: false, message: "Clinic not found" });
      }

      // Ensure photos are absolute URLs
      if (clinic.photos && Array.isArray(clinic.photos)) {
        clinic.photos = clinic.photos.map((photo) => {
          if (!photo) return photo;
          // If already an absolute URL, return as is
          if (photo.startsWith("http://") || photo.startsWith("https://")) {
            return photo;
          }
          // If it's a file system path, extract the uploads part
          if (photo.includes("uploads/")) {
            const uploadsIndex = photo.indexOf("uploads/");
            const relativePath = "/" + photo.substring(uploadsIndex);
            return `${getBaseUrl()}${relativePath}`;
          }
          // If it starts with /, prepend base URL
          if (photo.startsWith("/")) {
            return `${getBaseUrl()}${photo}`;
          }
          // Otherwise, prepend /uploads/clinic/ if it looks like a filename
          return `${getBaseUrl()}/uploads/clinic/${photo}`;
        });
      }
      // Ensure documents URLs are absolute
      if (clinic.documents && Array.isArray(clinic.documents)) {
        clinic.documents = clinic.documents.map((doc) => {
          if (!doc?.url) return doc;
          const url = doc.url;
          if (url.startsWith("http://") || url.startsWith("https://")) return doc;
          if (url.includes("uploads/")) {
            const idx = url.indexOf("uploads/");
            const rel = "/" + url.substring(idx);
            return { ...doc, url: `${getBaseUrl()}${rel}` };
          }
          if (url.startsWith("/")) {
            return { ...doc, url: `${getBaseUrl()}${url}` };
          }
          return { ...doc, url: `${getBaseUrl()}/uploads/clinic/documents/${url}` };
        });
      }
      if (clinic.licenseDocumentUrl) {
        clinic.licenseDocumentUrl = clinic.licenseDocumentUrl.startsWith("http")
          ? clinic.licenseDocumentUrl
          : `${getBaseUrl()}${clinic.licenseDocumentUrl}`;
      }

      return res.status(200).json({ success: true, clinic });
    } catch (error) {
      console.error("Error fetching clinic by ID:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

  // PUT - Update clinic
  if (method === "PUT") {
    try {
      console.log("🔄 Starting PUT request for clinic ID:", id);
      console.log("👤 User role:", me?.role);
      console.log("📥 Request headers:", req.headers);
      
      // When bodyParser is disabled, we need to parse the request manually
      // But for simplicity, let's re-enable bodyParser for this endpoint
      // and handle file uploads separately
      
      // With bodyParser disabled, only manually parse JSON bodies (never multipart)
      const contentType = req.headers["content-type"] || "";
      if (contentType.includes("application/json") && !req.body) {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const rawBody = Buffer.concat(chunks).toString();
        try {
          req.body = JSON.parse(rawBody || "{}");
        } catch {
          req.body = {};
        }
      }
      
      console.log("📦 Request body keys:", Object.keys(req.body || {}));

      // ✅ Resolve clinicId
      let clinicId;
      if (me.role === "clinic") {
        const clinic = await Clinic.findOne({ owner: me._id }).select("_id");
        if (!clinic) {
          return res.status(404).json({ success: false, message: "Clinic not found for this user" });
        }
        clinicId = clinic._id;
      } else if (me.role === "admin") {
        // Admin can update any clinic, use the ID from URL
        clinicId = id;
      } else if (["agent", "doctor", "doctorStaff", "staff"].includes(me.role)) {
        // For agent, doctor, doctorStaff, and staff, use their clinicId
        if (!me.clinicId) {
          return res.status(403).json({ success: false, message: "User not linked to a clinic" });
        }
        clinicId = me.clinicId;
        // Verify they're updating their own clinic
        if (clinicId.toString() !== id.toString()) {
          return res.status(403).json({ success: false, message: "Access denied" });
        }
      }

      // ✅ Check permission for updating clinic (only for agent, doctorStaff roles)
      // Clinic, doctor, and staff roles have full access by default, admin bypasses
      if (me.role !== "admin" && clinicId && ["agent", "doctorStaff"].includes(me.role)) {
        const { checkAgentPermission } = await import("../agent/permissions-helper");
        const result = await checkAgentPermission(
          me._id,
          "clinic_health_center",
          "update"
        );

        if (!result.hasPermission) {
          return res.status(403).json({
            success: false,
            message: result.error || "You do not have permission to update clinic information"
          });
        }
      }

      // Find the clinic by ID and verify ownership/access
      let existingClinic;
      if (me.role === "clinic") {
        existingClinic = await Clinic.findOne({
        _id: id,
          owner: me._id,
      });
      } else if (me.role === "admin") {
        existingClinic = await Clinic.findById(id);
      } else if (["agent", "doctor", "doctorStaff", "staff"].includes(me.role)) {
        // For agent, doctor, doctorStaff, and staff, verify clinicId matches
        if (!me.clinicId || me.clinicId.toString() !== id.toString()) {
          return res.status(403).json({ success: false, message: "Access denied" });
        }
        existingClinic = await Clinic.findById(id);
      }

      if (!existingClinic) {
        console.log("❌ Clinic not found for user:", me._id);
        return res
          .status(404)
          .json({ success: false, message: "Clinic not found or access denied" });
      }

      console.log("✅ Found existing clinic:", existingClinic._id);

      // Handle multiple file uploads if present
      let uploadedPhotoPaths = [];
      let uploadedDocumentPaths = [];
      if (req.headers["content-type"]?.includes("multipart/form-data")) {
        try {
          await runMiddleware(
            req,
            res,
            upload.fields([
              { name: "photos", maxCount: 10 },
              { name: "documents", maxCount: 20 },
            ])
          );
          const files = req.files || {};
          const photoFiles = Array.isArray(files.photos) ? files.photos : [];
          const documentFiles = Array.isArray(files.documents) ? files.documents : [];
          if (photoFiles.length > 0) {
            uploadedPhotoPaths = photoFiles.map((file) => `/uploads/clinic/${file.filename}`);
            console.log("📸 Files uploaded:", uploadedPhotoPaths);
          }
          if (documentFiles.length > 0) {
            uploadedDocumentPaths = documentFiles.map(
              (file) => `/uploads/clinic/documents/${file.filename}`
            );
            console.log("📄 Documents uploaded:", uploadedDocumentPaths);
          }
        } catch (uploadError) {
          console.error("File upload error:", uploadError);
          const msg = uploadError?.message || "File upload failed";
          return res
            .status(400)
            .json({ message: msg, error: uploadError?.message || null });
        }
      }

      // Parse the request body
      let updateData = {};
      
      // Handle both JSON and FormData requests
      if (req.headers["content-type"]?.includes("application/json")) {
        // For JSON requests
        updateData = { ...req.body };
      } else if (req.headers["content-type"]?.includes("multipart/form-data")) {
        // For multipart requests, data comes in req.body (parsed by Next.js when bodyParser is enabled)
        // But since we disabled bodyParser, we need to handle this differently
        console.log("📁 Handling multipart form data");
        // We'll rely on multer middleware to parse this
        updateData = { ...req.body };
      } else {
        // Fallback
        updateData = { ...req.body };
      }
      
      console.log("📦 Parsed update data keys:", Object.keys(updateData));

      // Parse JSON fields that come as strings from FormData
      if (typeof updateData.servicesName === "string") {
        try {
          updateData.servicesName = JSON.parse(updateData.servicesName);
        } catch {
          updateData.servicesName = updateData.servicesName
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s);
        }
      }

      if (typeof updateData.treatments === "string") {
        try {
          updateData.treatments = JSON.parse(updateData.treatments);
          // Ensure each treatment has the correct structure
          if (Array.isArray(updateData.treatments)) {
            updateData.treatments = updateData.treatments.map((treatment) => {
              if (typeof treatment === "string") {
                // Convert string to object format
                return {
                  mainTreatment: treatment,
                  mainTreatmentSlug: treatment
                    .toLowerCase()
                    .replace(/\s+/g, "-"),
                  subTreatments: [],
                };
              } else if (
                treatment.mainTreatment &&
                treatment.mainTreatmentSlug
              ) {
                // Ensure subTreatments array exists and has correct structure
                return {
                  ...treatment,
                  subTreatments: (treatment.subTreatments || []).map(
                    (subTreatment) => {
                      if (typeof subTreatment === "string") {
                        return {
                          name: subTreatment,
                          slug: subTreatment.toLowerCase().replace(/\s+/g, "-"),
                        };
                      }
                      return subTreatment;
                    }
                  ),
                };
              }
              return treatment;
            });
          }
        } catch (error) {
          console.error("Error parsing treatments:", error);
          // Fallback: convert comma-separated strings to treatment objects
          updateData.treatments = updateData.treatments
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s)
            .map((treatment) => ({
              mainTreatment: treatment,
              mainTreatmentSlug: treatment.toLowerCase().replace(/\s+/g, "-"),
              subTreatments: [],
            }));
        }
      }

      let existingPhotosFromClient = null;
      if (typeof updateData.existingPhotos === "string") {
        try {
          existingPhotosFromClient = JSON.parse(updateData.existingPhotos);
        } catch {
          existingPhotosFromClient = [];
        }
      } else if (Array.isArray(updateData.existingPhotos)) {
        existingPhotosFromClient = updateData.existingPhotos;
      }

      // Documents: parse existingDocuments and documentNames
      let existingDocumentsFromClient = null;
      if (typeof updateData.existingDocuments === "string") {
        try {
          existingDocumentsFromClient = JSON.parse(updateData.existingDocuments);
        } catch {
          existingDocumentsFromClient = [];
        }
      } else if (Array.isArray(updateData.existingDocuments)) {
        existingDocumentsFromClient = updateData.existingDocuments;
      }

      let documentNames = [];
      if (typeof updateData.documentNames === "string") {
        documentNames = [updateData.documentNames];
      } else if (Array.isArray(updateData.documentNames)) {
        documentNames = updateData.documentNames;
      }

      // Parse timings: handle legacy string format OR JSON string from FormData
      if (typeof updateData.timings === 'string') {
        try {
          const parsed = JSON.parse(updateData.timings);
          if (Array.isArray(parsed)) {
            updateData.timings = parsed;
          } else {
            // Legacy plain string like "8:00 AM - 9:00 PM" — drop it, keep existing
            delete updateData.timings;
          }
        } catch {
          // Not valid JSON (e.g. "8:00 AM - 9:00 PM") — remove to avoid cast error
          delete updateData.timings;
        }
      }

      // Validate each timing entry is a proper object
      if (Array.isArray(updateData.timings)) {
        const VALID_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
        const isValid = updateData.timings.every(
          (t) => t && typeof t === 'object' && VALID_DAYS.includes(t.day)
        );
        if (!isValid) delete updateData.timings;
      }

      // Parse listingVisibility from JSON string (FormData) or keep as object (JSON body)
      if (typeof updateData.listingVisibility === 'string') {
        try {
          updateData.listingVisibility = JSON.parse(updateData.listingVisibility);
        } catch {
          delete updateData.listingVisibility;
        }
      }

      // Parse bankDetails from JSON string (FormData) or keep as object (JSON body)
      if (typeof updateData.bankDetails === 'string') {
        try {
          updateData.bankDetails = JSON.parse(updateData.bankDetails);
        } catch {
          delete updateData.bankDetails;
        }
      }

      if (typeof updateData.location === "string") {
        try {
          updateData.location = JSON.parse(updateData.location);
        } catch (error) {
          console.error("Error parsing location:", error);
          // If parsing fails, remove the location field to avoid validation errors
          delete updateData.location;
        }
      }
      
      // Validate location format if present
      if (updateData.location) {
        // Ensure location has the correct structure
        if (!updateData.location.type || updateData.location.type !== "Point") {
          updateData.location.type = "Point";
        }
        if (!Array.isArray(updateData.location.coordinates) || updateData.location.coordinates.length !== 2) {
          // If coordinates are invalid, remove the location field
          console.log("Invalid location coordinates, removing location field");
          delete updateData.location;
        }
      }

      if (existingPhotosFromClient) {
        const oldPhotos = existingClinic.photos || [];
        const desiredPhotos = Array.isArray(existingPhotosFromClient) ? existingPhotosFromClient : [];
        const removedPhotos = oldPhotos.filter((p) => !desiredPhotos.includes(p));
        removedPhotos.forEach((photoPath) => {
          if (photoPath && photoPath.startsWith("/uploads/clinic/")) {
            const fullPath = path.join(process.cwd(), "public", photoPath);
            try {
              fs.unlinkSync(fullPath);
            } catch (err) {}
          }
        });
        updateData.photos = desiredPhotos;
      }

      if (uploadedPhotoPaths.length > 0) {
        const basePhotos = Array.isArray(updateData.photos) ? updateData.photos : (existingClinic.photos || []);
        const allPhotos = [...basePhotos];
        uploadedPhotoPaths.forEach((newPhoto) => {
          if (!allPhotos.includes(newPhoto)) {
            allPhotos.push(newPhoto);
          }
        });
        updateData.photos = allPhotos;
      }

      // Documents merging and cleanup
      if (existingDocumentsFromClient) {
        const oldDocs = Array.isArray(existingClinic.documents) ? existingClinic.documents : [];
        const desiredDocs = Array.isArray(existingDocumentsFromClient) ? existingDocumentsFromClient : [];
        const removedDocs = oldDocs.filter(
          (d) => !desiredDocs.some((nd) => nd.url === d.url)
        );
        removedDocs.forEach((doc) => {
          if (doc?.url && doc.url.startsWith("/uploads/clinic/documents/")) {
            const fullPath = path.join(process.cwd(), "public", doc.url);
            try {
              fs.unlinkSync(fullPath);
            } catch (err) {}
          }
        });
        updateData.documents = desiredDocs;
      }

      if (uploadedDocumentPaths.length > 0) {
        const baseDocs = Array.isArray(updateData.documents)
          ? updateData.documents
          : Array.isArray(existingClinic.documents)
          ? existingClinic.documents
          : [];
        const newDocs = uploadedDocumentPaths.map((url, idx) => ({
          name: documentNames[idx] || `Document ${idx + 1}`,
          url,
        }));
        const allDocs = [...baseDocs, ...newDocs];
        updateData.documents = allDocs;
      }

      // Remove undefined/empty fields
      Object.keys(updateData).forEach((key) => {
        if (
          updateData[key] === undefined ||
          updateData[key] === "undefined" ||
          updateData[key] === ""
        ) {
          delete updateData[key];
        }
      });

      // 🔒 Protect slug if it's locked (SEO stability)
      // If slug is locked, prevent changes to slug and slugLocked fields
      if (existingClinic.slugLocked) {
        // Remove slug and slugLocked from updateData to prevent changes
        delete updateData.slug;
        delete updateData.slugLocked;
        console.log("🔒 Slug is locked - preventing slug changes for SEO stability");
      }

      console.log("🔄 Updating clinic with data:", updateData);
      console.log("📦 Update data keys:", Object.keys(updateData));

      // Validate required fields
      const requiredFields = ['name', 'address'];
      const missingFields = requiredFields.filter(field => !updateData[field]);
      
      if (missingFields.length > 0) {
        console.log("❌ Missing required fields:", missingFields);
        return res.status(400).json({
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`,
          missingFields
        });
      }

      // Update the clinic - disable validation temporarily to debug
      console.log("🔄 Attempting update with validation disabled...");
      const updatedClinic = await Clinic.findByIdAndUpdate(
        existingClinic._id,
        updateData,
        { new: true, runValidators: false }
      );
      
      if (!updatedClinic) {
        console.log("❌ Update failed - clinic not found");
        return res.status(404).json({ success: false, message: "Clinic not found" });
      }
      
      console.log("✅ Update successful with validation disabled");

      // Ensure photos are absolute URLs
      if (
        updatedClinic &&
        updatedClinic.photos &&
        Array.isArray(updatedClinic.photos)
      ) {
        updatedClinic.photos = updatedClinic.photos.map((photo) => {
          if (!photo) return photo;
          // If already an absolute URL, return as is
          if (photo.startsWith("http://") || photo.startsWith("https://")) {
            return photo;
          }
          // If it's a file system path, extract the uploads part
          if (photo.includes("uploads/")) {
            const uploadsIndex = photo.indexOf("uploads/");
            const relativePath = "/" + photo.substring(uploadsIndex);
            return `${getBaseUrl()}${relativePath}`;
          }
          // If it starts with /, prepend base URL
          if (photo.startsWith("/")) {
            return `${getBaseUrl()}${photo}`;
          }
          // Otherwise, prepend /uploads/clinic/ if it looks like a filename
          return `${getBaseUrl()}/uploads/clinic/${photo}`;
        });
      }
      // Ensure documents URLs are absolute
      if (updatedClinic && updatedClinic.documents && Array.isArray(updatedClinic.documents)) {
        updatedClinic.documents = updatedClinic.documents.map((doc) => {
          if (!doc?.url) return doc;
          const url = doc.url;
          if (url.startsWith("http://") || url.startsWith("https://")) return doc;
          if (url.includes("uploads/")) {
            const idx = url.indexOf("uploads/");
            const rel = "/" + url.substring(idx);
            return { ...doc, url: `${getBaseUrl()}${rel}` };
          }
          if (url.startsWith("/")) {
            return { ...doc, url: `${getBaseUrl()}${url}` };
          }
          return { ...doc, url: `${getBaseUrl()}/uploads/clinic/documents/${url}` };
        });
      }
      if (updatedClinic && updatedClinic.licenseDocumentUrl) {
        updatedClinic.licenseDocumentUrl =
          updatedClinic.licenseDocumentUrl.startsWith("http")
            ? updatedClinic.licenseDocumentUrl
            : `${getBaseUrl()}${updatedClinic.licenseDocumentUrl}`;
      }

      console.log("✅ Clinic updated successfully:", updatedClinic);

      return res.status(200).json({
        success: true,
        clinic: updatedClinic,
        message: "Clinic updated successfully",
      });
    } catch (error) {
      console.error("❌ Error updating clinic:", error);
      console.error("❌ Error stack:", error.stack);
      console.error("❌ Error name:", error.name);
      
      if (error.name === "ValidationError") {
        console.error("Validation errors:", error.errors);
        return res
          .status(400)
          .json({ 
            success: false, 
            message: "Validation error", 
            details: error.errors,
            error: error.message 
          });
      }
      
      if (error.name === "CastError") {
        console.error("Cast error:", error);
        return res
          .status(400)
          .json({ 
            success: false, 
            message: "Invalid data format",
            error: error.message 
          });
      }
      
      return res.status(500).json({ 
        success: false, 
        message: "Internal server error",
        error: error.message 
      });
    }
  }

  // DELETE - Delete clinic
  if (method === "DELETE") {
    try {
      console.log("🗑️ Starting DELETE request for clinic ID:", id);

      // ✅ Resolve clinicId
      let clinicId;
      if (me.role === "clinic") {
        const clinic = await Clinic.findOne({ owner: me._id }).select("_id");
        if (!clinic) {
          return res.status(404).json({ success: false, message: "Clinic not found for this user" });
        }
        clinicId = clinic._id;
      } else if (me.role === "admin") {
        // Admin can delete any clinic, use the ID from URL
        clinicId = id;
      }

      // ✅ Check permission for deleting clinic (only for agent, doctorStaff, staff roles)
      // Clinic and doctor roles have full access by default, admin bypasses
      if (me.role !== "admin" && clinicId && ["agent", "staff", "doctorStaff"].includes(me.role)) {
        const { checkAgentPermission } = await import("../agent/permissions-helper");
        const result = await checkAgentPermission(
          me._id,
          "clinic_health_center",
          "delete"
        );

        if (!result.hasPermission) {
          return res.status(403).json({
            success: false,
            message: result.error || "You do not have permission to delete clinic"
          });
        }
      }

      // Find the clinic by ID and verify ownership (for clinic users)
      let existingClinic;
      if (me.role === "clinic") {
        existingClinic = await Clinic.findOne({
          _id: id,
          owner: me._id,
        });
      } else if (me.role === "admin") {
        existingClinic = await Clinic.findById(id);
      }

      if (!existingClinic) {
        console.log("❌ Clinic not found for user:", me._id);
        return res
          .status(404)
          .json({ success: false, message: "Clinic not found or access denied" });
      }

      console.log("✅ Found clinic to delete:", existingClinic._id);

      // Delete associated photos from filesystem
      if (existingClinic.photos && existingClinic.photos.length > 0) {
        existingClinic.photos.forEach((photoPath) => {
          if (photoPath && photoPath.startsWith("/uploads/clinic/")) {
            const fullPath = path.join(process.cwd(), "public", photoPath);
            fs.unlink(fullPath, (err) => {
              if (err) console.error("Error deleting photo:", err);
              else console.log("📸 Photo deleted:", photoPath);
            });
          }
        });
      }

      // Delete license document if exists
      if (existingClinic.licenseDocumentUrl) {
        const licensePath = path.join(
          process.cwd(),
          "public",
          existingClinic.licenseDocumentUrl
        );
        fs.unlink(licensePath, (err) => {
          if (err) console.error("Error deleting license document:", err);
          else console.log("📄 License document deleted");
        });
      }

      // Delete the clinic from database
      await Clinic.findByIdAndDelete(existingClinic._id);

      console.log("✅ Clinic deleted successfully");

      return res.status(200).json({
        success: true,
        message: "Clinic deleted successfully",
      });
    } catch (error) {
      console.error("❌ Error deleting clinic:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

  // Method not allowed
  console.log("❌ Method not allowed:", method);
  return res.status(405).json({ success: false, message: "Method not allowed" });
}

// Enable body parser for this endpoint to handle JSON requests properly
// Will handle file uploads with multer middleware
export const config = {
  api: {
    bodyParser: false,
  },
};
