"use client";
import React from 'react';
import { Layout, Edit, Info, Settings, PlusCircle } from 'lucide-react';

const BookAppointmentWorkflowGuide: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
          <div className="flex items-center gap-4 mb-2">
         
            <div>
              <h1 className="text-3xl font-bold">Book Appointment Workflow Guide</h1>
              <p className="text-blue-100 text-sm opacity-90">A comprehensive guide to the appointment scheduling system.</p>
            </div>
          </div>
        </div>

        {/* UI Preview Section */}
        <div className="p-8 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            
            Appointment Schedule Interface Overview
          </h2>
          <div className="aspect-video bg-gray-100 rounded-lg border-2 border-gray-200 flex flex-col items-center justify-center relative overflow-hidden group">
            <img 
              src="/new.png" 
              alt="Appointment Schedule UI" 
              className="w-full h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement?.querySelector('.placeholder-content')?.classList.remove('hidden');
              }}
            />
            <div className="placeholder-content hidden text-center p-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Layout className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-gray-600 font-medium">Image not found: /image.png</p>
              <p className="text-gray-400 text-sm mt-2">Please ensure image.png is in the public folder.</p>
            </div>
          </div>
        </div>

        {/* Detailed Explanation Section */}
        <div className="p-8 space-y-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Info className="w-6 h-6 text-blue-600" />
            Understanding the Booking System
          </h2>

          {/* Section 1: Overview of the Scheduler */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
              <Layout className="w-5 h-5 text-indigo-600" />
              1. The Scheduler Layout
            </h3>
            <p className="text-gray-600 leading-relaxed">
              The Appointment Schedule is an interactive, calendar-based system designed for efficient management of patient bookings. It provides a clear, real-time overview of your clinic's availability across various doctors and rooms.
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-gray-600">
              <li><strong>Time Slots:</strong> The vertical axis displays time slots, typically in 30-minute intervals, from morning to evening.</li>
              <li><strong>Resource Columns:</strong> Horizontal columns represent individual doctors or rooms, depending on the selected view.</li>
              <li><strong>Navigation:</strong> Use the date picker and chevron arrows at the top to navigate between days.</li>
            </ul>
          </div>

          {/* Section 2: Booking a New Appointment */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-green-600" />
              2. Booking a New Appointment
            </h3>
            <p className="text-gray-600 leading-relaxed">
              To book a new appointment, simply click on any empty time slot in the grid. This action will open the "Book Appointment" form.
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-gray-600">
              <li><strong>Form Details:</strong> Fill in the patient's required details, including name, contact information, and any relevant EMR details.</li>
              <li><strong>Service Selection:</strong> Choose the specific service or treatment the patient requires.</li>
              <li><strong>Confirmation:</strong> Once all details are entered and validated, confirm the booking. The selected slot will then display the patient's name.</li>
            </ul>
          </div>

          {/* Section 3: Viewing and Editing Existing Appointments */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
              <Edit className="w-5 h-5 text-yellow-600" />
              3. Managing Existing Appointments
            </h3>
            <p className="text-gray-600 leading-relaxed">
              After an appointment is booked, the patient's name will appear in the corresponding time slot. This visual cue helps in quickly identifying scheduled appointments.
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-gray-600">
              <li><strong>Editing Details:</strong> Clicking on a patient's name in the schedule will open an edit form, allowing you to update appointment details, change services, or reschedule.</li>
              <li><strong>Hover Preview (Tooltip):</strong> Hovering your mouse over a patient's name will display a tooltip or preview with essential patient details, such as EMR number, invoice number, gender, contact, doctor, and services.</li>
            </ul>
          </div>

          {/* Section 4: Configurable Elements */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-600" />
              4. Configurable Elements
            </h3>
            <p className="text-gray-600 leading-relaxed">
              The appointment system offers several configurable elements to adapt to your clinic's specific needs.
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-gray-600">
              <li><strong>Doctor/Room Selection:</strong> Easily switch between viewing schedules by doctor or by room using the filters at the top.</li>
              <li><strong>Time Slots:</strong> Time slot durations can be customized or imported to match your clinic's operational hours and appointment types.</li>
              <li><strong>Import Functionality:</strong> The "Import" button allows you to bring in appointment data from external sources, streamlining setup.</li>
              <li><strong>Status Colors:</strong> Use the "Colors" button to customize the color coding for different appointment statuses (e.g., Booked, Arrived, Cancelled) for better visual tracking.</li>
            </ul>
          </div>

          {/* Section 5: System Behaviors and Validations */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
              <Info className="w-5 h-5 text-red-600" />
              5. System Behaviors and Validations
            </h3>
            <p className="text-gray-600 leading-relaxed">
              The system incorporates smart behaviors and validations to ensure data integrity and prevent scheduling conflicts.
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-gray-600">
              <li><strong>Conflict Prevention:</strong> The system prevents double-booking of doctors or rooms at the same time.</li>
              <li><strong>Required Fields:</strong> Mandatory fields in the booking form ensure all necessary patient information is captured.</li>
              <li><strong>Real-time Updates:</strong> All changes are reflected instantly across the schedule for all users.</li>
              <li><strong>Past Date Restrictions:</strong> New bookings cannot be made for past dates.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookAppointmentWorkflowGuide;
