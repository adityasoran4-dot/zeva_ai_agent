import dbConnect from "./database.js";
import PatientRegistration from "../models/PatientRegistration.js";

/**
 * Generate the next sequential EMR number in format "EMR-605"
 * @returns {Promise<string>} The next EMR number
 */
export async function generateEmrNumber() {
  await dbConnect();

  try {
    // Find all patients with EMR numbers matching the pattern "EMR-{number}"
    const patients = await PatientRegistration.find({
      emrNumber: { $regex: /^EMR-\d+$/i },
    })
      .select("emrNumber")
      .lean();

    // Extract numeric parts and find the maximum
    let maxNumber = 0;
    for (const patient of patients) {
      if (patient.emrNumber) {
        const match = patient.emrNumber.match(/^EMR-(\d+)$/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      }
    }

    // Generate next EMR number
    const nextNumber = maxNumber + 1;
    return `EMR-${nextNumber}`;
  } catch (error) {
    console.error("Error generating EMR number:", error);
    // Fallback: use timestamp-based number if database query fails
    const fallbackNumber = Math.floor(Date.now() / 1000) % 1000000;
    return `EMR-${fallbackNumber}`;
  }
}

