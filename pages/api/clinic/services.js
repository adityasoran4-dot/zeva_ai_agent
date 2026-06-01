import dbConnect from "../../../lib/database";
import Service from "../../../models/Service";
import { getUserFromReq } from "../lead-ms/auth";
import { getClinicIdFromUser, checkClinicPermission } from "../lead-ms/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  const slugify = (text = "") =>
    String(text)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  let user;
  try {
    user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!["clinic", "doctor", "agent", "doctorStaff", "staff", "admin"].includes(user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  const { clinicId, error: clinicError } = await getClinicIdFromUser(user);
  if (clinicError || (!clinicId && user.role !== "admin")) {
    return res.status(403).json({
      success: false,
      message: clinicError || "Unable to determine clinic access",
    });
  }

  const moduleKey = "Clinic_services_setup";

  if (req.method === "GET") {
    try {
      // ✅ Special bypass for agent/doctorStaff to read services (required for Smart Recommendations)
      if (user.role !== "admin" && !["agent", "doctorStaff"].includes(user.role)) {
        const { hasPermission, error: permError } = await checkClinicPermission(clinicId, moduleKey, "read");
        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: permError || "You do not have permission to view services",
          });
        }
      }

      const { departmentId } = req.query;
      const criteria = { clinicId };
      if (departmentId) {
        criteria.departmentId = departmentId;
      }
      const services = await Service.find(criteria).sort({ createdAt: -1 }).lean();
      return res.status(200).json({ success: true, services });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Failed to fetch services" });
    }
  }

  if (req.method === "POST") {
    try {
      const { hasPermission, error: permError } = await checkClinicPermission(clinicId, moduleKey, "create");
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: permError || "You do not have permission to create services",
        });
      }

      const { name, serviceSlug, price, durationMinutes, departmentId, clinicPrice, items } = req.body;

      // Batch create path
      if (Array.isArray(items) && items.length > 0) {
        if (!departmentId) {
          return res.status(400).json({ success: false, message: "Department is required for batch service creation" });
        }
        const docs = [];
        for (const it of items) {
          const n = (it?.name || "").trim();
          if (!n) {
            return res.status(400).json({ success: false, message: "Each item must have a name" });
          }
          const p = parseFloat(it?.price);
          if (isNaN(p) || p < 0) {
            return res.status(400).json({ success: false, message: `Invalid price for service "${n}"` });
          }
          const d = parseInt(it?.durationMinutes);
          if (isNaN(d) || d < 5) {
            return res.status(400).json({ success: false, message: `Invalid duration for service "${n}"` });
          }
          const cPrice = it?.clinicPrice === undefined || it?.clinicPrice === null ? null : parseFloat(it?.clinicPrice);
          if (cPrice !== null && (isNaN(cPrice) || cPrice < 0)) {
            return res.status(400).json({ success: false, message: `Invalid clinic price for service "${n}"` });
          }
          docs.push({
            clinicId,
            departmentId,
            name: n,
            serviceSlug: slugify(n),
            price: p,
            clinicPrice: cPrice,
            durationMinutes: d,
            createdBy: user._id,
            isActive: true,
          });
        }
        try {
          const inserted = await Service.insertMany(docs, { ordered: false });
          return res.status(201).json({
            success: true,
            message: "Services created",
            services: inserted,
          });
        } catch (e) {
          if (e?.writeErrors && Array.isArray(e.writeErrors)) {
            const dupCount = e.writeErrors.filter((w) => w.code === 11000).length;
            const otherErrors = e.writeErrors.length - dupCount;
            const parts = [];
            if (dupCount) parts.push(`${dupCount} duplicate name(s) skipped`);
            if (otherErrors) parts.push(`${otherErrors} invalid record(s) skipped`);
            return res.status(201).json({
              success: true,
              message: `Services created with partial success (${parts.join(", ")})`,
            });
          }
          if (e.code === 11000) {
            return res.status(400).json({ success: false, message: "One or more services already exist for this department" });
          }
          return res.status(500).json({ success: false, message: "Failed to create services" });
        }
      }

      // Single create path
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: "Service name is required" });
      }
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 0) {
        return res.status(400).json({ success: false, message: "Valid price is required" });
      }
      const durationNum = parseInt(durationMinutes);
      if (isNaN(durationNum) || durationNum < 5) {
        return res.status(400).json({ success: false, message: "Valid duration (min 5) is required" });
      }
      const clinicPriceNum = clinicPrice === undefined || clinicPrice === null ? null : parseFloat(clinicPrice);
      if (clinicPriceNum !== null && (isNaN(clinicPriceNum) || clinicPriceNum < 0)) {
        return res.status(400).json({ success: false, message: "Valid clinic price is required" });
      }

      const exists = await Service.findOne({ clinicId, departmentId: departmentId || null, name: name.trim() });
      if (exists) {
        return res.status(400).json({ success: false, message: "A service with this name already exists in this department" });
      }

      const service = await Service.create({
        clinicId,
        departmentId: departmentId || null,
        name: name.trim(),
        serviceSlug: (serviceSlug && serviceSlug.trim()) || slugify(name),
        price: priceNum,
        clinicPrice: clinicPriceNum,
        durationMinutes: durationNum,
        createdBy: user._id,
        isActive: true,
      });

      return res.status(201).json({ success: true, message: "Service created", service });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ success: false, message: "A service with this name already exists in this department" });
      }
      if (error.name === "ValidationError") {
        return res.status(400).json({ success: false, message: error.message || "Validation error" });
      }
      return res.status(500).json({ success: false, message: "Failed to create service" });
    }
  }

  if (req.method === "PUT") {
    try {
      const { hasPermission, error: permError } = await checkClinicPermission(clinicId, moduleKey, "update");
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: permError || "You do not have permission to update services",
        });
      }

      const { serviceId, name, serviceSlug, price, durationMinutes, isActive, departmentId, clinicPrice } = req.body;
      if (!serviceId) {
        return res.status(400).json({ success: false, message: "Service ID is required" });
      }
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: "Service name is required" });
      }
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 0) {
        return res.status(400).json({ success: false, message: "Valid price is required" });
      }
      const durationNum = parseInt(durationMinutes);
      if (isNaN(durationNum) || durationNum < 5) {
        return res.status(400).json({ success: false, message: "Valid duration (min 5) is required" });
      }
      const clinicPriceNum = clinicPrice === undefined || clinicPrice === null ? null : parseFloat(clinicPrice);
      if (clinicPriceNum !== null && (isNaN(clinicPriceNum) || clinicPriceNum < 0)) {
        return res.status(400).json({ success: false, message: "Valid clinic price is required" });
      }

      const service = await Service.findOne({ _id: serviceId, clinicId });
      if (!service) {
        return res.status(404).json({ success: false, message: "Service not found" });
      }
      const duplicate = await Service.findOne({
        clinicId,
        name: name.trim(),
        departmentId: departmentId ?? service.departmentId ?? null,
        _id: { $ne: serviceId },
      });
      if (duplicate) {
        return res.status(400).json({ success: false, message: "Another service with this name exists in this department" });
      }

      service.name = name.trim();
      service.serviceSlug = (serviceSlug && serviceSlug.trim()) || slugify(name);
      service.price = priceNum;
      service.clinicPrice = clinicPriceNum;
      if (departmentId !== undefined) {
        service.departmentId = departmentId || null;
      }
      service.durationMinutes = durationNum;
      if (typeof isActive === "boolean") {
        service.isActive = isActive;
      }
      await service.save();

      return res.status(200).json({ success: true, message: "Service updated", service });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Failed to update service" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { hasPermission, error: permError } = await checkClinicPermission(clinicId, moduleKey, "delete");
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: permError || "You do not have permission to delete services",
        });
      }

      const { serviceId } = req.query;
      if (!serviceId) {
        return res.status(400).json({ success: false, message: "Service ID is required" });
      }

      const service = await Service.findOne({ _id: serviceId, clinicId });
      if (!service) {
        return res.status(404).json({ success: false, message: "Service not found" });
      }

      await Service.findByIdAndDelete(serviceId);
      return res.status(200).json({ success: true, message: "Service deleted" });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Failed to delete service" });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
  return res.status(405).json({ success: false, message: "Method not allowed" });
}
