"use client";

import React, { useEffect, useRef, useState } from "react";
import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";

import {
  X,
  MapPin,
  Navigation,
  Search,
  Crosshair,
  Loader2,
  LocateFixed,
} from "lucide-react";

import toast from "react-hot-toast";

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;

  onSelectLocation: (location: {
    lat: number;
    lng: number;
    address: string;
    name?: string;
  }) => void;

  selectedConversation?: any;

  handleSendMessage: (location: any) => Promise<void>;
}

const LIBRARIES: "places"[] = ["places"];

const fallbackCenter = {
  lat: 25.2048,
  lng: 55.2708,
};

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  selectedConversation,
  handleSendMessage,
}) => {
  const mapRef = useRef<google.maps.Map | null>(null);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [selectedAddress, setSelectedAddress] = useState("");

  const [locationName, setLocationName] = useState("");

  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const [isSending, setIsSending] = useState(false);

  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(
    fallbackCenter,
  );

  const [hasDetectedLocation, setHasDetectedLocation] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
  });

  // AUTO DETECT CURRENT LOCATION ON OPEN
  useEffect(() => {
    if (!isOpen) return;

    if (hasDetectedLocation) return;

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        setMapCenter({ lat: latitude, lng: longitude });

        setHasDetectedLocation(true);

        if (mapRef.current) {
          mapRef.current.panTo({ lat: latitude, lng: longitude });

          mapRef.current.setZoom(17);
        }
      },
      () => {
        // Silently fallback to default center if location denied
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  }, [isOpen, hasDetectedLocation]);

  // AUTO FOCUS SEARCH
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 400);
    }
  }, [isOpen]);

  // GOOGLE AUTOCOMPLETE
  useEffect(() => {
    if (!isLoaded) return;

    if (!isOpen) return;

    if (!searchInputRef.current) return;

    if (autocompleteRef.current) return;

    if (!window.google?.maps?.places) {
      console.error("Places library not loaded");

      return;
    }

    autocompleteRef.current = new google.maps.places.Autocomplete(
      searchInputRef.current,
      {
        fields: ["formatted_address", "geometry", "name"],

        types: ["geocode"],
      },
    );

    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current?.getPlace();

      if (!place?.geometry?.location) {
        toast.error("Location not found");

        return;
      }

      const lat = place.geometry.location.lat();

      const lng = place.geometry.location.lng();

      setSelectedLocation({
        lat,
        lng,
      });

      setSelectedAddress(place.formatted_address || "");

      setLocationName(place.name || "");

      if (mapRef.current) {
        mapRef.current.panTo({
          lat,
          lng,
        });

        mapRef.current.setZoom(17);
      }
    });

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);

        autocompleteRef.current = null;
      }
    };
  }, [isLoaded, isOpen]);

  // REVERSE GEOCODE
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const geocoder = new google.maps.Geocoder();

      const response = await geocoder.geocode({
        location: {
          lat,
          lng,
        },
      });

      if (response.results[0]) {
        setSelectedAddress(response.results[0].formatted_address);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // MAP CLICK
  const handleMapClick = async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;

    const lat = e.latLng.lat();

    const lng = e.latLng.lng();

    setSelectedLocation({
      lat,
      lng,
    });

    setLocationName("Pinned Location");

    await reverseGeocode(lat, lng);
  };

  // CURRENT LOCATION
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");

      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;

        const lng = position.coords.longitude;

        setSelectedLocation({
          lat,
          lng,
        });

        setLocationName("Current Location");

        if (mapRef.current) {
          mapRef.current.panTo({
            lat,
            lng,
          });

          mapRef.current.setZoom(17);
        }

        await reverseGeocode(lat, lng);

        setIsGettingLocation(false);

        toast.success("Current location found");
      },

      (error) => {
        console.error(error);

        toast.error("Unable to fetch location");

        setIsGettingLocation(false);
      },

      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      },
    );
  };

  // SEND LOCATION
  const handleSendLocation = async () => {
    if (!selectedLocation) {
      toast.error("Please select a location");

      return;
    }

    if (!selectedConversation?._id) {
      toast.error("Conversation not found");

      return;
    }

    setIsSending(true);

    try {
      const location = {
        latitude: selectedLocation.lat,

        longitude: selectedLocation.lng,

        address: selectedAddress,

        name: locationName,
      };

      await handleSendMessage(location);

      onSelectLocation({
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        address: selectedAddress,
        name: locationName,
      });

      handleClose();

      toast.success("Location shared successfully");
    } catch (error: any) {
      console.error(error);

      toast.error(error?.response?.data?.message || "Failed to send location");
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setSelectedLocation(null);

    setSelectedAddress("");

    setLocationName("");

    setMapCenter(fallbackCenter);

    setHasDetectedLocation(false);

    onClose();
  };

  if (!isOpen) return null;

  // ERROR
  if (loadError) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Google Maps Error
          </h2>

          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
            {loadError.message}
          </div>

          <button
            onClick={onClose}
            className="w-full mt-6 h-12 rounded-2xl bg-black text-white font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
        <div className="relative w-full max-w-6xl h-[96vh] rounded-3xl shadow-2xl bg-white">
          {/* HEADER */}

          <div className="absolute top-0 left-0 right-0 z-20 p-5">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-green-600 flex items-center justify-center">
                    <MapPin className="text-white w-7 h-7" />
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Share Location
                    </h2>

                    <p className="text-sm text-gray-500">
                      Search or select any location
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleClose}
                  className="w-12 h-12 rounded-2xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* SEARCH */}

              <div className="mt-5 relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />

                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search places, hospitals, restaurants..."
                  className="w-full h-14 pl-14 pr-5 rounded-2xl border border-gray-200 bg-white focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 text-gray-800"
                />
              </div>
            </div>
          </div>

          {/* MAP */}

          <div className="absolute inset-0 rounded-3xl overflow-hidden">
            {!isLoaded ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="flex flex-col items-center">
                  <Loader2 className="w-10 h-10 animate-spin text-green-600" />

                  <p className="mt-4 text-gray-600 font-medium">
                    Loading Google Maps...
                  </p>
                </div>
              </div>
            ) : (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={selectedLocation || mapCenter}
                zoom={selectedLocation ? 17 : hasDetectedLocation ? 17 : 12}
                onClick={handleMapClick}
                onLoad={(map) => {
                  mapRef.current = map;
                }}
                options={{
                  disableDefaultUI: true,
                  zoomControl: true,
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: false,
                  gestureHandling: "greedy",
                  clickableIcons: false,
                }}
              >
                {selectedLocation && <MarkerF position={selectedLocation} />}
              </GoogleMap>
            )}
          </div>

          {/* LOCATION CARD */}

          {selectedLocation && (
            <div className="absolute bottom-28 left-5 right-5 z-20">
              <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-5 shadow-2xl border border-gray-100">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-green-600 flex items-center justify-center">
                    <Navigation className="text-white w-6 h-6" />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900">
                      {locationName || "Selected Location"}
                    </h3>

                    <p className="text-sm text-gray-600 mt-1">
                      {selectedAddress}
                    </p>

                    <div className="flex items-center gap-2 mt-3 text-xs text-gray-500 font-mono">
                      <LocateFixed className="w-3 h-3" />

                      <span>
                        {selectedLocation.lat.toFixed(6)},{" "}
                        {selectedLocation.lng.toFixed(6)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CURRENT LOCATION BUTTON */}

          <div className="absolute bottom-32 right-6 z-30">
            <button
              onClick={handleGetCurrentLocation}
              disabled={isGettingLocation}
              className="group relative overflow-hidden bg-white hover:bg-green-600 transition-all duration-300 shadow-2xl rounded-2xl px-5 h-14 flex items-center gap-3 border border-gray-200 hover:border-green-600"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative z-10 flex items-center gap-3">
                {isGettingLocation ? (
                  <Loader2 className="w-5 h-5 animate-spin text-green-600 group-hover:text-white" />
                ) : (
                  <Crosshair className="w-5 h-5 text-gray-700 group-hover:text-white" />
                )}

                <span className="text-sm font-semibold text-gray-800 group-hover:text-white">
                  Current Location
                </span>
              </div>
            </button>
          </div>

          {/* FOOTER */}

          <div className="absolute bottom-0 left-0 right-0 z-20 p-5">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-100 p-4 flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 h-14 rounded-2xl border border-gray-300 font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={handleSendLocation}
                disabled={!selectedLocation || isSending}
                className="flex-1 h-14 rounded-2xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-3"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Navigation className="w-5 h-5" />
                    Send Location
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        .pac-container {
          z-index: 999999 !important;
          border-radius: 18px !important;
          overflow: hidden !important;
          margin-top: 8px !important;
          border: 1px solid #e5e7eb !important;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15) !important;
          background: white !important;
          font-family: inherit !important;
        }

        .pac-item {
          padding: 14px !important;
          cursor: pointer !important;
          font-size: 14px !important;
          border-top: 1px solid #f3f4f6 !important;
        }

        .pac-item:hover {
          background: #f0fdf4 !important;
        }

        .pac-item-query {
          color: #111827 !important;
          font-size: 14px !important;
          font-weight: 600 !important;
        }

        .pac-icon {
          margin-right: 10px !important;
        }
      `}</style>
    </>
  );
};

export default LocationPickerModal;
