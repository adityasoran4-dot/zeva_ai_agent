import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getAuth, applyActionCode, verifyPasswordResetCode } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/lib/firebase';

export default function AuthActionPage() {
  const router = useRouter();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for router to be ready
    if (!router.isReady) return;

    const handleAuthAction = async () => {
      try {
        const mode = router.query.mode as string;
        const oobCode = router.query.oobCode as string;

        if (!mode || !oobCode) {
          setError('Invalid verification link. Missing required parameters.');
          setLoading(false);
          return;
        }

        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);

        // Handle password reset - Firebase uses 'signIn' mode for sendSignInLinkToEmail
        // Also handle 'action' mode which is used in Firebase email templates
        if (mode === 'resetPassword' || mode === 'signIn' || mode === 'action') {
          // Verify the password reset code is valid
          try {
            await verifyPasswordResetCode(auth, oobCode);
            
            // Get email from localStorage (set when forgot password was submitted)
            const clinicEmail = localStorage.getItem('clinicEmailForReset');
            const doctorEmail = localStorage.getItem('doctorEmailForReset');
            const adminEmail = localStorage.getItem('adminEmailForReset');
            const userEmail = localStorage.getItem('userEmailForReset');

            // Determine which reset password page to redirect to based on stored email type
            if (clinicEmail) {
              router.push(`/clinic/reset-password?email=${encodeURIComponent(clinicEmail)}&oobCode=${oobCode}`);
            } else if (doctorEmail) {
              router.push(`/doctor/reset-password?email=${encodeURIComponent(doctorEmail)}&oobCode=${oobCode}`);
            } else if (adminEmail) {
              router.push(`/admin/reset-password?email=${encodeURIComponent(adminEmail)}&oobCode=${oobCode}`);
            } else if (userEmail) {
              router.push(`/auth/reset-password?email=${encodeURIComponent(userEmail)}&oobCode=${oobCode}`);
            } else {
              // If no email in localStorage, try to get from URL or show error
              const emailParam = router.query.email as string;
              if (emailParam) {
                // Default to user reset password if email is in URL but not in localStorage
                router.push(`/auth/reset-password?email=${encodeURIComponent(emailParam)}&oobCode=${oobCode}`);
              } else {
                setError('Email not found. Please request a new password reset link.');
                setLoading(false);
              }
            }
          } catch (err: any) {
            console.error('Error verifying password reset code:', err);
            setError(err.message || 'Invalid or expired verification link. Please request a new one.');
            setLoading(false);
          }
        } else if (mode === 'verifyEmail') {
          // Handle email verification
          try {
            await applyActionCode(auth, oobCode);
            router.push('/clinic/login-clinic?verified=true');
          } catch (err: any) {
            console.error('Error applying action code:', err);
            setError(err.message || 'Invalid or expired verification link.');
            setLoading(false);
          }
        } else {
          setError(`Unknown action mode: ${mode}`);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Error handling auth action:', err);
        setError(err.message || 'An error occurred processing the verification link.');
        setLoading(false);
      }
    };

    handleAuthAction();
  }, [router.isReady, router.query]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Verifying your link...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-md w-full">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.598 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <a
              href="/clinic/forgot-password"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Request New Link
            </a>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

