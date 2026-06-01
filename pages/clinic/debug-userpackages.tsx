import React, { useState, useEffect } from 'react';


const TOKEN_PRIORITY = [
  "clinicToken",
  "doctorToken",
  "agentToken",
  "staffToken",
  "userToken",
  "adminToken",
];

const getStoredToken = () => {
  if (typeof window === "undefined") return null;
  for (const key of TOKEN_PRIORITY) {
    const value = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (value) return value;
  }
  return null;
};

const DebugUserPackages = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getStoredToken();
    
    const info: any = {
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'NONE',
      clinicTokens: [],
    };

    // Check all token locations
    TOKEN_PRIORITY.forEach(key => {
      const localValue = localStorage.getItem(key);
      const sessionValue = sessionStorage.getItem(key);
      if (localValue || sessionValue) {
        info.clinicTokens.push({
          key,
          localStorage: localValue ? 'YES' : 'NO',
          sessionStorage: sessionValue ? 'YES' : 'NO',
        });
      }
    });

    // Decode token
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const decoded = JSON.parse(jsonPayload);
        info.decodedToken = decoded;
      } catch (e) {
        info.tokenDecodeError = e;
      }
    }

    setDebugInfo(info);

    // Fetch packages
    fetchPackages(token);
  }, []);

  const fetchPackages = async (token: string | null) => {
    if (!token) {
      setError('No authentication token found');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/clinic/user-packages?status=approved', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setPackages(data.packages);
      } else {
        setError(data.message || 'Failed to fetch packages');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">User Packages Debug</h1>

        {/* Debug Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Info</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600 font-semibold">Error: {error}</p>
          </div>
        )}

        {/* Packages Display */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Packages ({packages.length})
          </h2>
          
          {loading && <p className="text-gray-500">Loading...</p>}
          
          {!loading && packages.length === 0 && !error && (
            <p className="text-gray-500">No packages found</p>
          )}

          <div className="space-y-4">
            {packages.map(pkg => (
              <div key={pkg._id} className="border rounded p-4">
                <div className="grid grid-cols-2 gap-2">
                  <div><strong>ID:</strong> {pkg._id}</div>
                  <div><strong>Name:</strong> {pkg.packageName}</div>
                  <div><strong>Patient:</strong> {pkg.patientId?.firstName} {pkg.patientId?.lastName}</div>
                  <div><strong>Clinic ID:</strong> {pkg.clinicId}</div>
                  <div><strong>Status:</strong> {pkg.approvalStatus}</div>
                  <div><strong>Price:</strong> ₹{pkg.totalPrice}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-6 space-x-4">
          <a 
            href="/clinic/userpackages" 
            className="text-blue-600 hover:underline"
          >
            Go to User Packages Page
          </a>
          <button
            onClick={() => window.location.reload()}
            className="text-blue-600 hover:underline"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebugUserPackages;
