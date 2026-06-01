// pages/api/clinics/geocode.js
import axios from 'axios';
import { getUserFromReq } from '../lead-ms/auth';
import { getClinicIdFromUser, checkClinicPermission } from '../lead-ms/permissions-helper';

export default async function handler(req, res) {
  const { place } = req.query;
  if (!place) return res.status(400).json({ message: 'Place is required' });

  try {
    // Check authentication and permissions for clinic-related roles
    // Note: This API is used for public clinic search, so we allow unauthenticated access
    // but still check permissions for authenticated users who might be updating clinic info
    let authUser = null;
    try {
      authUser = await getUserFromReq(req);
      if (authUser) {
        // Allow clinic, admin, agent, doctor, doctorStaff, and staff roles
        if (!["clinic", "admin", "agent", "doctor", "doctorStaff", "staff"].includes(authUser.role)) {
          // For public search functionality, allow access even if role doesn't match
          // Only restrict if this is clearly an admin/update operation
          console.log("User role not in allowed list, but allowing for public search:", authUser.role);
        } else {
          const { clinicId, error, isAdmin } = await getClinicIdFromUser(authUser);
          
          // ✅ Check permission for using geocode (only for agent, doctorStaff, staff roles)
          // Clinic and doctor roles have full access by default, admin bypasses
          // This is typically used when updating clinic info, so check update permission
          if (!isAdmin && clinicId && ["agent", "staff", "doctorStaff"].includes(authUser.role)) {
            const { checkAgentPermission } = await import("../agent/permissions-helper");
            const result = await checkAgentPermission(
              authUser._id,
              "clinic_health_center",
              "update"
            );

            if (!result.hasPermission) {
              // For public search, allow access even without update permission
              // Only restrict if this is clearly an admin operation
              console.log("User doesn't have update permission, but allowing for public search");
            }
          }
        }
      }
    } catch (authError) {
      // If authentication fails, allow access (geocoding is used for public search)
      console.log("Auth check failed for geocode, allowing public access:", authError.message);
    }

    // Check if API key is configured
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('Google Maps API key is not configured');
      return res.status(500).json({ message: 'Geocoding service is not configured. Please contact support.' });
    }

    // Add region bias for better results (in = India)
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: { 
        address: place, 
        key: apiKey,
        region: 'in' // Bias results towards India
      }
    });

    // Log the full response for debugging
    console.log('Google Maps Geocode API Response:', {
      status: response.data.status,
      error_message: response.data.error_message,
      place: place
    });

    // Check Google Maps API response status
    if (response.data.status === 'ZERO_RESULTS') {
      return res.status(404).json({ message: 'Location not found. Please try a different location or add more details.' });
    }

    if (response.data.status === 'REQUEST_DENIED') {
      const errorMsg = response.data.error_message || 'API key may be invalid or Geocoding API not enabled';
      console.error('Google Maps API request denied:', {
        error_message: errorMsg,
        place: place,
        apiKey_present: !!apiKey,
        apiKey_length: apiKey ? apiKey.length : 0,
        full_response: response.data
      });
      
      // Provide helpful error message based on the specific error
      let userMessage = 'Geocoding service error. Please try again later.';
      if (errorMsg.includes('not authorized') || errorMsg.includes('API project')) {
        userMessage = 'Geocoding API is not enabled. Please enable the Geocoding API in Google Cloud Console for this project.';
      } else if (errorMsg.includes('API key')) {
        userMessage = 'Invalid API key or API key restrictions. Please check your Google Maps API key configuration.';
      }
      
      return res.status(500).json({ 
        message: userMessage,
        details: process.env.NODE_ENV === 'development' ? errorMsg : undefined,
        error_code: 'GEOCODE_API_ERROR'
      });
    }

    if (response.data.status === 'OVER_QUERY_LIMIT') {
      console.error('Google Maps API quota exceeded');
      return res.status(500).json({ message: 'Geocoding service temporarily unavailable. Please try again later.' });
    }

    if (response.data.status === 'INVALID_REQUEST') {
      return res.status(400).json({ message: 'Invalid location query. Please provide a valid location.' });
    }

    if (response.data.status !== 'OK') {
      console.error('Google Maps API error:', response.data.status, response.data.error_message);
      return res.status(500).json({ message: 'Geocoding failed. Please try again.' });
    }

    const result = response.data.results?.[0];
    const location = result?.geometry?.location;

    if (!location) {
      return res.status(404).json({ message: 'Location not found. Please try a different location or add more details.' });
    }

    // Enhanced international location detection
    const locationInfo = analyzeLocation(result, place);

    res.status(200).json({
      lat: location.lat,
      lng: location.lng,
      isDubai: locationInfo.isDubai,
      isInternational: locationInfo.isInternational,
      country: locationInfo.country,
      formattedAddress: result.formatted_address
    });
  } catch (err) {
    console.error('Geocoding error:', err);
    res.status(500).json({ message: 'Geocoding failed', error: err.message });
  }
}

// Enhanced function to analyze location for international support
function analyzeLocation(result, originalPlace) {
  const addressComponents = result.address_components || [];
  const formattedAddress = result.formatted_address?.toLowerCase() || '';
  const searchQuery = originalPlace.toLowerCase();
  
  // Extract country information
  const countryComponent = addressComponents.find(component => 
    component.types.includes('country')
  );
  const country = countryComponent ? countryComponent.long_name : 'Unknown';
  
  // Check if location is outside India
  const isInternational = country !== 'India';
  
  // Dubai-specific detection
  const dubaiKeywords = [
    'dubai', 'دبي', 'uae', 'united arab emirates', 
    'emirate', 'burj', 'sheikh zayed', 'marina', 
    'downtown dubai', 'jumeirah', 'deira', 'bur dubai'
  ];
  
  const isDubai = dubaiKeywords.some(keyword => 
    searchQuery.includes(keyword) ||
    formattedAddress.includes(keyword) ||
    addressComponents.some(component => 
      component.long_name.toLowerCase().includes(keyword) ||
      component.short_name.toLowerCase().includes(keyword)
    )
  );
  
  // Check coordinates bounds for Dubai
  const lat = result.geometry.location.lat;
  const lng = result.geometry.location.lng;
  
  const dubaiBounds = {
    north: 25.5000,
    south: 24.8000,
    east: 55.6000,
    west: 54.8000,
  };

  const isWithinDubaiBounds = 
    lat >= dubaiBounds.south &&
    lat <= dubaiBounds.north &&
    lng >= dubaiBounds.west &&
    lng <= dubaiBounds.east;

  return {
    isDubai: isDubai || isWithinDubaiBounds,
    isInternational,
    country
  };
}