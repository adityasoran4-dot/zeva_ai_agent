import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Heart, Users, MapPin, Calculator, Gamepad2, Briefcase, Shield, Award, Zap, ChevronRight, Star, Globe, Lock } from 'lucide-react';

const About: React.FC = () => {
  const features = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Healthcare Provider Registration & Management",
      description: "ZEVA offers a robust registration system for clinics and medical professionals featuring multi-step verification, admin approval workflows, profile management, personalized dashboards, patient tracking, appointment scheduling, revenue monitoring, and complete service management tools to enhance operational efficiency."
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "Advanced Geolocation & Provider Discovery",
      description: "Our location-based search engine uses GPS technology, radius-based filtering, specialty-specific searches, real-time availability updates, and route optimization. Providers' profiles include ratings, reviews, operating hours, services, and insurance acceptance, helping patients make informed healthcare decisions."
    },
    {
      icon: <Calculator className="w-8 h-8" />,
      title: "Interactive Health Tools & Wellness Games",
      description: "ZEVA provides medical calculators and educational games covering nutrition, fitness, symptom checking, and wellness goals. These tools help patients maintain a healthy lifestyle while improving medical literacy."
    },
    {
      icon: <Briefcase className="w-8 h-8" />,
      title: "Professional Networking & Content Management",
      description: "Our platform allows healthcare professionals to post jobs, internships, research projects, and share blogs, case studies, and medical insights. Features include social sharing, comments, and collaborative networking opportunities."
    }
  ];

  const stats = [
    { number: "1,200+", label: "Verified Healthcare Providers & Medical Centers", icon: <Users className="w-6 h-6" /> },
    { number: "50,000+", label: "Active Patients & Healthcare Seekers", icon: <Heart className="w-6 h-6" /> },
    { number: "150+", label: "Cities & Metropolitan Areas Covered", icon: <MapPin className="w-6 h-6" /> },
    { number: "98.5%", label: "User Satisfaction & Platform Reliability", icon: <Star className="w-6 h-6" /> }
  ];

  const values = [
    { icon: <Heart className="w-6 h-6" />, title: "Patient-Centric Healthcare Excellence", desc: "Prioritizing accessibility, care quality, and positive health outcomes." },
    { icon: <Shield className="w-6 h-6" />, title: "Trust, Security & Data Privacy", desc: "Ensuring HIPAA compliance, advanced encryption, and secure medical data." },
    { icon: <Zap className="w-6 h-6" />, title: "Technological Innovation & Advancement", desc: "Leveraging AI, machine learning, and digital health technologies." },
    { icon: <Award className="w-6 h-6" />, title: "Medical Excellence & Quality Assurance", desc: "Maintaining the highest standards in professional care and platform performance." }
  ];

  return (
    <>
      <Head>
        <title>About ZEVA – Digital Healthcare Platform & Verified Providers</title>
        <meta name="description" content="Discover ZEVA, a digital healthcare platform connecting patients with verified providers, wellness tools, interactive health calculators, and comprehensive services." />
        <meta name="keywords" content="ZEVA healthcare platform, digital healthcare, verified healthcare providers, wellness tools, interactive health calculators, medical services management, healthcare technology, patient care platform, medical professional networking, online health tools" />
        <meta property="og:title" content="About ZEVA – Digital Healthcare Platform & Verified Providers" />
        <meta property="og:description" content="Discover ZEVA, a digital healthcare platform connecting patients with verified providers, wellness tools, interactive health calculators, and comprehensive services." />
        <meta property="og:url" content="https://zeva360.com/about" />
        <link rel="canonical" href="https://zeva360.com/about" />
        <meta name="robots" content="index, follow" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative container mx-auto px-4 py-20 lg:py-32">
            <div className="text-center max-w-4xl mx-auto">
              <div className="mb-6">
                {/* <Heart className="w-16 h-16 mx-auto text-pink-300" /> */}
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
                About <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-yellow-300">ZEVA</span>
              </h1>
              <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto leading-relaxed">
                ZEVA is a digital healthcare platform connecting patients and professionals through smart tools and transparent services, making quality care accessible for all. With 1,200+ verified providers, 50,000+ users, and presence in 150+ cities, ZEVA maintains 98.5% user satisfaction built on trust and excellence.
              </p>

              {/* Stats Preview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-2xl mx-auto">
                {['1200+', '50K+', '150+', '98.5%'].map((stat, i) => (
                  <div key={i} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                    <div className="text-2xl font-bold">{stat}</div>
                    <div className="text-sm opacity-80">
                      {['Providers', 'Users', 'Cities', 'Satisfaction'][i]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 w-full h-20 bg-gradient-to-t from-blue-50 to-transparent"></div>
        </section>

        {/* Mission Statement */}
        <section className="py-16 lg:py-24 relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8 text-center">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-8">
                  Our Mission
                </h2>
              </div>

              <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12 border border-gray-100">
                <div className="text-lg md:text-xl text-gray-700 leading-relaxed space-y-6 text-left">
                  <p className="text-justify">
                    At ZEVA, our mission is to bridge the digital divide in healthcare services. We empower healthcare centers and medical professionals with advanced administrative dashboards, complete patient and service management tools, and seamless registration systems. For patients, we provide intuitive features to locate nearby healthcare providers, access wellness tools, and stay informed about their health.
                  </p>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-l-4 border-blue-600">
                    <p className="font-bold text-gray-800 text-xl mb-4">Our platform integrates:</p>
                    
                    <ul className="space-y-4 list-none pl-0">
                      <li className="flex items-start">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-4 mt-0.5">
                          <Calculator className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-gray-800">Interactive Health Calculators</span>
                          <span className="text-gray-600"> – BMI, calorie counters, pregnancy trackers, medication dosage calculators, and risk assessment tools.</span>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center mr-4 mt-0.5">
                          <Gamepad2 className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-gray-800">Wellness & Educational Games</span>
                          <span className="text-gray-600"> – Fun, engaging ways to boost medical literacy and promote healthy lifestyle choices.</span>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mr-4 mt-0.5">
                          <Briefcase className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-gray-800">Professional Networking & Content Management</span>
                          <span className="text-gray-600"> – Medical job postings, blogs, research articles, case studies, and collaborative projects.</span>
                        </div>
                      </li>
                    </ul>
                  </div>
                  
                  <p className="text-justify">
                    Using advanced geolocation technology, secure data management, and user-friendly design, ZEVA creates a unified digital healthcare ecosystem where technology meets patient-centered care.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Stats */}
        <section className="py-16 bg-gradient-to-r from-indigo-500 to-purple-600 text-white relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-8">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">Platform Impact</h3>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center bg-white/10 rounded-2xl p-4">
                  <div className="flex justify-center mb-3">
                    {stat.icon}
                  </div>
                  <div className="text-2xl md:text-3xl font-bold mb-2">{stat.number}</div>
                  <div className="text-sm md:text-base opacity-90">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 lg:py-24 relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
                Platform Features
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Comprehensive healthcare solutions designed for modern digital needs
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
              {features.map((feature, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow duration-300">
                  <div className="flex items-start space-x-4">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3 rounded-xl">
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 lg:py-24 bg-gray-50 relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
                Our Core Values
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <div key={index} className="bg-white rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    {value.icon}
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2">{value.title}</h3>
                  <p className="text-gray-600 text-sm">{value.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Vision Section */}
        <section className="py-16 lg:py-24 relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="mb-8">
                <Globe className="w-16 h-16 mx-auto text-blue-600" />
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-8">
                Our Vision
              </h2>

              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-3xl p-8 lg:p-12 shadow-2xl">
                <p className="text-lg md:text-xl leading-relaxed">
                  ZEVA envisions becoming the premier global healthcare technology platform, establishing a seamless digital ecosystem where patients, healthcare institutions, and medical professionals collaborate efficiently. Our goal is to eliminate geographical barriers to quality healthcare through innovative technology while maintaining the highest standards of medical ethics, data security, and patient confidentiality.
                  <br /><br />
                  By integrating verified medical professionals, comprehensive health resources, and personalized care tools, ZEVA is transforming how healthcare is delivered, accessed, and experienced worldwide.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-purple-600 to-indigo-600 text-white relative overflow-hidden">
          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="w-16 h-16 mx-auto mb-6">
              {/* <Heart className="w-8 h-8 text-white" /> */}
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Healthcare?
            </h2>

            <p className="text-xl mb-8 opacity-90">
              Join thousands of healthcare professionals and patients on ZEVA
            </p>

            <div className="flex justify-center space-x-8 mb-8 text-sm opacity-80">
              <div>1200+ Providers</div>
              <div>50K+ Users</div>
              <div>150+ Cities</div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/">
                <button className="bg-white text-indigo-600 px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition-colors duration-300 flex items-center mx-auto">
                  Get Started Today
                  <ChevronRight className="w-5 h-5 ml-2" />
                </button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 flex justify-center items-center space-x-6 opacity-60 flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span className="text-sm">HIPAA Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <Lock className="w-5 h-5" />
                <span className="text-sm">Secure Platform</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5" />
                <span className="text-sm">Verified Providers</span>
              </div>
            </div>
          </div>
        </section>
    </div>
    </>
  );
};

export default About;
