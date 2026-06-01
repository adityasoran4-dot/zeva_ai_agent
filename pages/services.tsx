// pages/services.tsx
import React from 'react';

const Services: React.FC = () => {
  return (
    <div className="min-h-screen px-8 py-16 bg-green-50 text-green-800">
      <h1 className="text-4xl font-bold mb-4">Our Services</h1>
      <p className="mb-4">At AyurVeda, we offer a range of holistic healing services tailored to your well-being:</p>
      <ul className="list-disc list-inside space-y-2">
        <li>Personalized Ayurvedic Consultations</li>
        <li>Herbal Remedies & Supplements</li>
        <li>Panchakarma Detox Treatments</li>
        <li>Yoga & Meditation Classes</li>
        <li>Diet & Lifestyle Guidance</li>
      </ul>
    </div>
  );
};

export default Services;
