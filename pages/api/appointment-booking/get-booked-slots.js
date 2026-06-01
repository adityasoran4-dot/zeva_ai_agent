import dbConnect from "../../../lib/database";
import Appointment from "../../../models/Appointment";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  await dbConnect();

  try {
    const { doctorId, clinicId, date } = req.query;

    if (!doctorId || !clinicId || !date) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters: doctorId, clinicId, date",
      });
    }

    // Parse the date - handle both YYYY-MM-DD format and ISO strings
    let startOfDay, endOfDay;

    // If date is in YYYY-MM-DD format, create date range using local time
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = date.split("-").map(Number);
      startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
      endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
    } else {
      // Fallback for ISO strings or other formats
      const selectedDate = new Date(date);
      startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
      endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));
    }

    console.log({
      date,
      startOfDay,
      endOfDay,
    });

    // Fetch all active appointments for this doctor and clinic on the selected date
    const appointments = await Appointment.find({
      doctorId,
      clinicId,
      startDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      status: { $nin: ["cancelled", "no-show"] },
    }).select("fromTime");

    // Extract the booked time slots
    const bookedSlots = appointments.map((apt) => apt.fromTime);

    res.status(200).json({
      success: true,
      data: {
        bookedSlots,
      },
    });
  } catch (error) {
    console.log("Error in fetching booked slots: ", error?.message);
    res.status(500).json({
      success: false,
      message: error?.message || "Internal server error",
    });
  }
}
