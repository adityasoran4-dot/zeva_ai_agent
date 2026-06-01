    import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Shield, Lock, CheckCircle2, ArrowLeft, AlertTriangle } from 'lucide-react';

const Security: React.FC = () => {
  const measures = [
    {
      icon: <Lock className="w-6 h-6" />,
      title: 'Data Encryption',
      desc: 'All data is encrypted in transit and at rest using industry-standard encryption protocols.',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Access Controls',
      desc: 'Role-based access controls ensure only authorized personnel can access sensitive information.',
    },
    {
      icon: <CheckCircle2 className="w-6 h-6" />,
      title: 'HIPAA Compliance',
      desc: 'We comply with HIPAA regulations and maintain strict security standards for healthcare data.',
    },
    {
      icon: <AlertTriangle className="w-6 h-6" />,
      title: 'Regular Audits',
      desc: 'We conduct regular security audits and penetration testing to identify and fix vulnerabilities.',
    },
  ];

  const practices = [
    'Secure data centers with physical security',
    'Regular security updates and patches',
    'Employee security training programs',
    'Incident response procedures',
    'Data backup and disaster recovery',
    'Multi-factor authentication',
    'Secure API endpoints',
    'Regular vulnerability assessments',
  ];

  return (
    <>
      <Head>
        <title>Data Security - ZEVA Healthcare Platform</title>
        <meta
          name="description"
          content="ZEVA Data Security - Learn about our security measures, encryption, HIPAA compliance, and how we protect your healthcare data."
        />
        <meta name="robots" content="index, follow" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 py-16">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Data Security</h1>
                <p className="text-gray-600 mt-1">How we protect your information</p>
              </div>
            </div>
          </div>

          {/* Introduction */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <p className="text-gray-700 leading-relaxed">
              At ZEVA, security is our top priority. We implement multiple layers of security 
              measures to protect your personal and health information. This page outlines our 
              security practices and commitments.
            </p>
          </div>

          {/* Security Measures */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {measures.map((measure, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6">
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4 text-teal-600">
                  {measure.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{measure.title}</h3>
                <p className="text-gray-600">{measure.desc}</p>
              </div>
            ))}
          </div>

          {/* Security Practices */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Security Practices</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {practices.map((practice, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{practice}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Compliance & Certifications</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">HIPAA Compliant</p>
                  <p className="text-gray-600 text-sm">
                    We comply with Health Insurance Portability and Accountability Act (HIPAA) 
                    regulations for healthcare data protection.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">SOC 2 Certified</p>
                  <p className="text-gray-600 text-sm">
                    Our systems undergo regular SOC 2 audits to ensure security, availability, 
                    and confidentiality.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Security Concerns?</h2>
            <p className="text-gray-700 mb-4">
              If you have security concerns or notice any suspicious activity, please contact us immediately:
            </p>
            <div className="space-y-2 text-gray-700">
              <p><strong>Email:</strong> security@zeva360.com</p>
              <p><strong>Phone:</strong> +91 123 456 7890</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Security;

