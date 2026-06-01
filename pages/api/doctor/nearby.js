// pages/api/doctors/nearby.js

import dbConnect from "../../../lib/database";
import DoctorProfile from "../../../models/DoctorProfile";
import Treatment from "../../../models/Treatment";
import "../../../models/Users"; // Register the User model
import axios from "axios";

// Helper to get base URL
function getBaseUrl() {
  if (process.env.NODE_ENV === "production") {
    return process.env.NEXT_PUBLIC_BASE_URL || "https://zeva360.com";
  }
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
}

export default async function handler(req, res) {
  await dbConnect();
  const { lat, lng, service } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ message: "Latitude and longitude required" });
  }

  try {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // ✅ Get comprehensive location info
    const locationInfo = await checkLocationInfo(latitude, longitude);

    const query = {
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          // ✅ Use location info for search radius
          $maxDistance: locationInfo.isInternational ? 200000 : 100000,
        },
      },
    };

    if (service) {
      // Parse the service string to extract sub-treatment and main treatment
      let subTreatmentName = service;
      let mainTreatmentName = null;

      // Check if service is in format "Sub Treatment (Main Treatment)"
      const match = service.match(/^(.+?)\s*\((.+?)\)$/);
      if (match) {
        subTreatmentName = match[1].trim();
        mainTreatmentName = match[2].trim();
      }

      // console.log("Parsed service:", {
      //   subTreatmentName,
      //   mainTreatmentName,
      //   originalService: service,
      // });

      // First, try to find the exact treatment in the global Treatment model
      let foundTreatment = null;
      let foundSubTreatment = null;

      try {
        // Search for main treatment first
        if (mainTreatmentName) {
          foundTreatment = await Treatment.findOne({
            name: { $regex: new RegExp(mainTreatmentName, "i") },
          }).lean();
        }

        // If main treatment not found or not provided, search by sub-treatment
        if (!foundTreatment) {
          foundTreatment = await Treatment.findOne({
            "subcategories.name": { $regex: new RegExp(subTreatmentName, "i") },
          }).lean();
        }

        if (foundTreatment) {
          // Find the specific sub-treatment
          foundSubTreatment = foundTreatment.subcategories?.find((sub) =>
            sub.name.toLowerCase().includes(subTreatmentName.toLowerCase())
          );

          if (foundSubTreatment) {
            // console.log(
            //   "Found sub-treatment:",
            //   foundSubTreatment.name,
            //   "in main treatment:",
            //   foundTreatment.name
            // );

            // Search for doctors that have this specific sub-treatment
            query.$or = [
              { "treatments.subTreatments.name": foundSubTreatment.name },
              { "treatments.mainTreatment": foundTreatment.name },
              { "user.name": { $regex: new RegExp(service, "i") } },
              { degree: { $regex: new RegExp(service, "i") } },
            ];
          } else {
            // If sub-treatment not found, search by main treatment
            // console.log(
            //   "Sub-treatment not found, searching by main treatment:",
            //   foundTreatment.name
            // );
            query.$or = [
              { "treatments.mainTreatment": foundTreatment.name },
              { "user.name": { $regex: new RegExp(service, "i") } },
              { degree: { $regex: new RegExp(service, "i") } },
            ];
          }
        } else {
          // Fallback to regex search if treatment not found in global model
          // console.log(
          //   "Treatment not found in global model, using fallback search"
          // );
          query.$or = [
            {
              "treatments.mainTreatment": { $regex: new RegExp(service, "i") },
            },
            {
              "treatments.subTreatments.name": {
                $regex: new RegExp(service, "i"),
              },
            },
            { "user.name": { $regex: new RegExp(service, "i") } },
            { degree: { $regex: new RegExp(service, "i") } },
          ];
        }
      } catch (error) {
        // console.error("Error searching for treatment:", error);
        // Fallback to regex search with proper regex patterns
        query.$or = [
          { "treatments.mainTreatment": { $regex: new RegExp(service, "i") } },
          {
            "treatments.subTreatments.name": {
              $regex: new RegExp(service, "i"),
            },
          },
          { "user.name": { $regex: new RegExp(service, "i") } },
          { degree: { $regex: new RegExp(service, "i") } },
        ];
      }
    }

    let doctors = await DoctorProfile.find(query)
      .populate("user", "name email phone profileImage isApproved declined role")
      .select(
        "degree experience address location user rating reviews verified consultationFee clinicContact timeSlots treatments photos resumeUrl slug slugLocked"
      )
      // ✅ Use location info for result limits
      .limit(locationInfo.isInternational ? 100 : 50)
      .lean();

    // ✅ Only include approved doctors
    doctors = doctors.filter((doc) => doc.user?.isApproved === true && doc.user?.declined !== true);

    // ✅ Convert profileImage & photos to full URL
    doctors = doctors.map((doc) => {
      const user = doc.user || {};
      let profileImage = user.profileImage;

      // ✅ Process profileImage
      if (profileImage?.startsWith("http")) {
        // Already full URL - leave as is
      } else if (profileImage?.startsWith("/uploads/")) {
        // Relative path - convert to full URL
        profileImage = `${getBaseUrl()}${profileImage}`;
      } else if (profileImage) {
        // Handle filename or partial path
        const filename = profileImage.includes("uploads/clinic/")
          ? profileImage.split("uploads/clinic/").pop()
          : profileImage;
        profileImage = `${getBaseUrl()}/uploads/clinic/${filename}`;
      }

      // ✅ Process photos array - FIXED LOGIC
      const photos = (doc.photos || [])
        .map((photo) => {
          if (!photo) return null;

          // Case 1: Already full URL
          if (photo.startsWith("http")) return photo;

          // Case 2: Relative path (starts with /)
          if (photo.startsWith("/uploads/")) {
            return `${getBaseUrl()}${photo}`;
          }

          // Case 3: Handle filename or partial path
          // Since doctors save to /uploads/clinic/, we need to handle this correctly
          let filename = photo;
          if (photo.includes("uploads/clinic/")) {
            filename = photo.split("uploads/clinic/").pop();
          } else if (photo.includes("uploads/doctor/")) {
            // Legacy path handling if any exist
            filename = photo.split("uploads/doctor/").pop();
          }

          return `${getBaseUrl()}/uploads/clinic/${filename}`;
        })
        .filter(Boolean); // Remove null values

      // ✅ Process resumeUrl if present
      let resumeUrl = doc.resumeUrl;
      if (resumeUrl && !resumeUrl.startsWith("http")) {
        if (resumeUrl.startsWith("/uploads/")) {
          resumeUrl = `${getBaseUrl()}${resumeUrl}`;
        } else {
          const filename = resumeUrl.includes("uploads/clinic/")
            ? resumeUrl.split("uploads/clinic/").pop()
            : resumeUrl;
          resumeUrl = `${getBaseUrl()}/uploads/clinic/${filename}`;
        }
      }

      return {
        ...doc,
        user: {
          ...user,
          profileImage,
        },
        photos,
        resumeUrl,
      };
    });

    // ✅ Dubai-specific prioritization logic
    if (locationInfo.isDubai) {
      let prioritizedDoctors = doctors.filter((doc) => doc.verified === true);
      let otherDoctors = doctors.filter((doc) => doc.verified !== true);

      doctors = [...prioritizedDoctors, ...otherDoctors];
    }

    // ✅ Apply final result count based on location
    doctors = doctors.slice(0, locationInfo.isInternational ? 30 : 20);

    res.status(200).json({
      success: true,
      doctors,
      locationInfo, // Optional: include location info in response
    });
  } catch (error) {
    // console.error("Error fetching doctors:", error);
    res
      .status(500)
      .json({ message: "Error fetching doctors", error: error.message });
  }
}

// ✅ Updated function to match clinics API - returns comprehensive location info
async function checkLocationInfo(lat, lng) {
  try {
    const dubaiBounds = {
      north: 25.5,
      south: 24.8,
      east: 55.6,
      west: 54.8,
    };

    const isWithinDubaiBounds =
      lat >= dubaiBounds.south &&
      lat <= dubaiBounds.north &&
      lng >= dubaiBounds.west &&
      lng <= dubaiBounds.east;

    try {
      const response = await axios.get(
        "https://maps.googleapis.com/maps/api/geocode/json",
        {
          params: {
            latlng: `${lat},${lng}`,
            key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
          },
        }
      );

      const results = response.data.results;
      if (results && results.length > 0) {
        const addressComponents = results[0].address_components;

        const countryComponent = addressComponents.find((component) =>
          component.types.includes("country")
        );
        const country = countryComponent
          ? countryComponent.long_name
          : "Unknown";

        const isDubai =
          addressComponents.some(
            (component) =>
              component.long_name.toLowerCase().includes("dubai") ||
              component.short_name.toLowerCase().includes("dubai") ||
              component.long_name.toLowerCase().includes("دبي") ||
              component.long_name.toLowerCase().includes("uae") ||
              component.long_name.toLowerCase().includes("united arab emirates")
          ) || isWithinDubaiBounds;

        return {
          isDubai,
          isInternational: country !== "India",
          country,
        };
      }
    } catch (geocodeError) {
      // console.log(
      //   "Geocoding error, falling back to bounds check:",
      //   geocodeError.message
      // );
      return {
        isDubai: isWithinDubaiBounds,
        isInternational: false,
        country: "Unknown",
      };
    }

    return {
      isDubai: isWithinDubaiBounds,
      isInternational: false,
      country: "Unknown",
    };
  } catch (error) {
    // console.error("Error checking location:", error);
    return {
      isDubai: false,
      isInternational: false,
      country: "Unknown",
    };
  }
}
