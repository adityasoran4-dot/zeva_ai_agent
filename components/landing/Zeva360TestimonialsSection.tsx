import React from "react";
import { Heart } from "lucide-react";

const Zeva360TestimonialsSection: React.FC = () => {
  const testimonials = [
    {
      rating: 5,
      quote: '"Zeva360 has completely transformed how we manage our clinic. It saves us hours every day!"',
      name: "Dr. Rajesh Mehta",
      role: "Orthopedic Surgeon • Mumbai",
      avatar: "R",
    },
    {
      rating: 5,
      quote: '"Our no-shows dropped by 40% within the first month. The WhatsApp automation is a game-changer!"',
      name: "Dr. Priya Sharma",
      role: "Dermatologist • Bangalore",
      avatar: "P",
    },
  ];

  const stats = [
    { value: "500+", label: "Happy Clinics", color: "text-blue-600" },
    { value: "40%", label: "Reduced No-Shows", color: "text-orange-500" },
    { value: "10hrs", label: "Saved Per Week", color: "text-green-500" },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Doctors Love Zeva360! <Heart className="inline-block w-8 h-8 text-pink-500 fill-pink-500 ml-2" />
          </h2>
          <p className="text-sm text-gray-600">Join hundreds of happy healthcare professionals</p>
        </div>

        {/* Testimonial Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-lg border border-blue-100"
            >
              {/* Quote Icon */}
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-3">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <p className="text-sm text-gray-700 leading-relaxed mb-4 italic">
                {testimonial.quote}
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-blue-200">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{testimonial.name}</p>
                  <p className="text-xs text-gray-600">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-xl p-5 shadow-md text-center"
            >
              <p className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</p>
              <p className="text-xs text-gray-600 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Zeva360TestimonialsSection;
