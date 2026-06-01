// pages/testimonials.tsx
import React from 'react';

const Testimonials: React.FC = () => {
  return (
    <div className="min-h-screen px-8 py-16 bg-green-50 text-green-800">
      <h1 className="text-4xl font-bold mb-4">What Our Clients Say</h1>
      <p className="mb-6">
        Hear from some of our happy clients who have experienced healing and transformation through AyurVeda.
      </p>
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="italic">&quot;AyurVeda changed my life. After months of chronic pain, their treatments brought me real relief.&quot;</p>
          <p className="mt-2 font-semibold">– Radhika S.</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="italic">&quot;I loved the personalized approach. The doctors truly care and the herbal remedies really worked for me.&quot;</p>
          <p className="mt-2 font-semibold">– Arjun M.</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="italic">&quot;Their Panchakarma therapy was deeply cleansing. I feel more balanced and energetic than ever.&quot;</p>
          <p className="mt-2 font-semibold">– Sneha T.</p>
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
