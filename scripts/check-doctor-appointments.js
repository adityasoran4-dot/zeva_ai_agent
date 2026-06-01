import dbConnect from "../lib/database";
import Appointment from "../models/Appointment";
import User from "../models/Users";
import Clinic from "../models/Clinic";

async function checkDoctorAppointments() {
  await dbConnect();

  console.log('🔍 Checking Doctor Appointments Data...\n');

  // 1. Check total appointments
  const totalAppointments = await Appointment.countDocuments({});
  console.log(`📊 Total appointments in database: ${totalAppointments}`);

  // 2. Get all clinics
  const clinics = await Clinic.find({}).select('_id name').lean();
  console.log(`\n🏥 Total clinics: ${clinics.length}`);
  
  if (clinics.length > 0) {
   const clinicId = clinics[0]._id;
   console.log(`\n📍 Checking first clinic: ${clinicId}`);
    
    // 3. Check appointments for this clinic
   const clinicAppointments = await Appointment.find({ clinicId }).limit(5).lean();
   console.log(`📋 Appointments for this clinic: ${await Appointment.countDocuments({ clinicId })}`);
    
    if (clinicAppointments.length > 0) {
     console.log('\n📝 Sample appointment:', JSON.stringify(clinicAppointments[0], null, 2));
      
      // 4. Check doctor IDs in appointments
     const doctorIds = [...new Set(clinicAppointments.map(apt => apt.doctorId.toString()))];
     console.log(`\n👨‍⚕️ Unique doctor IDs found: ${doctorIds.length}`);
     console.log('Doctor IDs:', doctorIds);
      
      // 5. Check if these doctors exist in User model
     const doctors = await User.find({ 
        _id: { $in: doctorIds },
        role: 'doctor'
      }).select('_id firstName lastName email role').lean();
      
     console.log(`\n✅ Doctors found in User model: ${doctors.length}`);
      if (doctors.length > 0) {
       console.log('Sample doctor:', doctors[0]);
      } else {
       console.log('❌ No doctors found with these IDs!');
      }
    } else {
     console.log('❌ No appointments found for this clinic');
    }
  }

  // 6. Check all doctors in the system
  const allDoctors = await User.find({ role: 'doctor' }).select('_id firstName lastName email').lean();
  console.log(`\n👨‍⚕️ Total doctors in system: ${allDoctors.length}`);
  
  if (allDoctors.length > 0) {
   console.log('Sample doctors:');
    allDoctors.slice(0, 3).forEach(doc => {
     console.log(`  - Dr. ${doc.firstName} ${doc.lastName} (${doc._id})`);
    });
    
    // 7. Check appointments for these doctors
   const doctorIds = allDoctors.map(d => d._id);
   const doctorApts = await Appointment.find({ 
      doctorId: { $in: doctorIds }
    }).limit(5).lean();
    
   console.log(`\n📋 Appointments for these doctors: ${await Appointment.countDocuments({ doctorId: { $in: doctorIds } })}`);
    if (doctorApts.length > 0) {
     console.log('Sample appointment for a doctor:', {
        doctorId: doctorApts[0].doctorId,
        status: doctorApts[0].status,
        startDate: doctorApts[0].startDate
      });
    }
  }

  process.exit(0);
}

checkDoctorAppointments().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
