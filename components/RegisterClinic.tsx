import React from 'react';

const RegisterClinic = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Register Your Clinic</h1>
      <p className="mb-6">Fill out the form below to register your Ayurvedic clinic with us.</p>

      {/* Example Form */}
      <form className="space-y-4">
        <input type="text" placeholder="Clinic Name" className="w-full border px-4 py-2 rounded" />
        <input type="text" placeholder="Address" className="w-full border px-4 py-2 rounded" />
        <input type="email" placeholder="Email" className="w-full border px-4 py-2 rounded" />
        <button
          type="submit"
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default RegisterClinic;

