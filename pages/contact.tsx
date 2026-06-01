"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";
import { MdAddIcCall } from "react-icons/md";
import { motion } from "framer-motion";

interface FormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

interface Errors {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
}

export default function Contact() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): Errors => {
    const newErrors: Errors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required.";
    else if (!/^[a-zA-Z\s]+$/.test(formData.name)) newErrors.name = "Only letters allowed.";

    if (!formData.email.trim()) newErrors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email.";

    if (!formData.phone.trim()) newErrors.phone = "Phone is required.";
    else if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = "Must be 10 digits.";

    if (!formData.subject.trim()) newErrors.subject = "Subject is required.";
    if (!formData.message.trim()) newErrors.message = "Message is required.";

    return newErrors;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("Message sent successfully!");
        setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
        setErrors({});
      } else {
        alert("Failed to send message. Please try again.");
      }
    } catch (err) {
      alert("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Banner Section */}
      <section className="relative h-[300px] sm:h-[500px] md:h-[400px] overflow-hidden flex items-center justify-center text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500 via-teal-100 to-teal-500">
          {/* <img
            src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=1920&h=800&fit=crop&auto=format"
            alt="ZEVA Healthcare - Contact Us"
            className="w-full h-full object-cover opacity-30"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          /> */}
        </div>
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 text-center px-4 max-w-screen-md">
          <motion.h1
            initial={{ opacity: 0, y: -30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="border-4 border-white rounded-lg px-8 sm:px-16 md:px-20 py-3 bg-black/50 text-white text-3xl sm:text-5xl md:text-6xl font-extrabold drop-shadow-xl leading-tight text-center inline-block"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Contact Us
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            className="mt-4 text-lg sm:text-xl text-white/90"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            We're here to help! Get in touch with our healthcare support team.
          </motion.p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Information Cards */}
          <div className="lg:col-span-1 space-y-6">
            {/* Address Card */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-9 border-l-4 border-teal-600 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="bg-teal-100 p-3 rounded-lg">
                  <FaMapMarkerAlt className="text-teal-700 text-2xl" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-800 mb-2">Our Location</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    ZEVA Healthcare<br />
                  
                    New Delhi, India
                  </p>
                  <a 
                    href="https://maps.google.com/?q=New+Delhi+India" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3 text-teal-700 font-medium hover:text-teal-800 transition-colors text-sm"
                  >
                    Get Directions →
                  </a>
                </div>
              </div>
            </div>

            {/* Phone Card */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-teal-600 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="bg-teal-100 p-3 rounded-lg">
                  <MdAddIcCall className="text-teal-700 text-2xl" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-800 mb-2">Phone Number</h3>
                  <a href="tel:+911234567890" className="text-teal-700 font-medium hover:text-teal-800 transition-colors">
                    +91 123 456 7890
                  </a>
                </div>
              </div>
            </div>

            {/* Email Card */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-teal-600 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="bg-teal-100 p-3 rounded-lg">
                  <FaEnvelope className="text-teal-700 text-2xl" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-800 mb-2">Email Address</h3>
                  <a href="mailto:support@zeva360.com" className="text-teal-700 font-medium hover:text-teal-800 transition-colors break-all">
                    support@zeva360.com
                  </a>
                </div>
              </div>
            </div>

          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Send Us a Message</h2>
                <p className="text-gray-600 text-sm">
                  Have a question about our healthcare services? Need help with appointments, telemedicine, or insurance? Fill out the form below and our ZEVA Healthcare support team will get back to you within 24 hours.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name and Email Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setFormData({ ...formData, name: e.target.value.replace(/[^a-zA-Z\s]/g, "") })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                      placeholder="Enter your Name"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                      placeholder="Enter your Email"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                </div>

                {/* Phone and Subject Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                      placeholder="10-digit mobile number"
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="subject"
                      value={formData.subject}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                      placeholder="General Inquiry, Appointment, Telemedicine, etc."
                    />
                    {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    value={formData.message}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all resize-none"
                    placeholder="Tell us about your healthcare inquiry, appointment needs, or any questions..."
                  />
                  {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-teal-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="bg-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center" style={{ fontFamily: "'Playfair Display', serif" }}>Find Us on Map</h2>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3503.123456789!2d77.209021!3d28.613939!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cfd5b347eb62d%3A0x52c2b7494e204dce!2sNew%20Delhi%2C%20Delhi!5e0!3m2!1sen!2sin!4v1234567890"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="ZEVA Healthcare Location"
            ></iframe>
          </div>
        </div>
      </section>
    </div>
  );
}