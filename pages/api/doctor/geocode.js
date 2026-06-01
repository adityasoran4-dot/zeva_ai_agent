import axios from 'axios';

export default async function handler(req, res) {
  const { place } = req.query;
  if (!place) return res.status(400).json({ message: 'Place is required' });

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: { address: place, key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY }
    });

    const result = response.data.results?.[0];
    const location = result?.geometry?.location;
        
    if (!location) return res.status(404).json({ message: 'Location not found' });

    // Check if the searched place is in Dubai
    const isDubai = result.address_components?.some(component => 
      component.long_name.toLowerCase().includes('dubai') ||
      component.short_name.toLowerCase().includes('dubai') ||
      component.long_name.toLowerCase().includes('دبي')
    ) || place.toLowerCase().includes('dubai');

    res.status(200).json({
      lat: location.lat,
      lng: location.lng,
      isDubai: isDubai,
      formattedAddress: result.formatted_address
    });
  } catch (err) {
    // console.error('Geocoding error:', err);
    res.status(500).json({ message: 'Geocoding failed', error: err.message });
  }
}