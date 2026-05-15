import React from "react";
import {
  MapPin,
  ExternalLink,
  // Navigation
} from "lucide-react";

interface LocationMessageProps {
  latitude: number;
  longitude: number;
  address: string;
  name?: string;
  direction?: "incoming" | "outgoing";
}

const LocationMessage: React.FC<LocationMessageProps> = ({
  latitude,
  longitude,
  address,
  name,
  direction = "outgoing",
}) => {
  const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

  const openInMaps = () => {
    window.open(mapsUrl, "_blank");
  };

  return (
    <div
      className={`rounded-lg overflow-hidden shadow-md max-w-sm ${
        direction === "outgoing"
          ? "bg-gradient-to-br from-green-500 to-green-600"
          : "bg-white border border-gray-200"
      }`}
    >
      {/* Map Preview */}
      <div className="relative h-48 bg-gray-200">
        <img
          src={`https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=400x200&markers=color:${
            direction === "outgoing" ? "white" : "red"
          }%7C${latitude},${longitude}&key=${
            process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
          }`}
          alt="Location map"
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback if static map fails
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `
                <div class="w-full h-full flex items-center justify-center bg-gradient-to-br ${
                  direction === "outgoing"
                    ? "from-green-400 to-green-500"
                    : "from-gray-100 to-gray-200"
                }">
                  <svg class="w-16 h-16 ${
                    direction === "outgoing" ? "text-white" : "text-green-600"
                  }" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                </div>
              `;
            }
          }}
        />

        {/* Location Pin Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`p-3 rounded-full shadow-lg ${
              direction === "outgoing" ? "bg-white/90" : "bg-green-600/90"
            }`}
          >
            <MapPin
              className={`w-8 h-8 ${
                direction === "outgoing" ? "text-green-600" : "text-white"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Location Info */}
      <div className="p-3">
        {name && (
          <p
            className={`font-semibold text-sm mb-1 ${
              direction === "outgoing" ? "text-white" : "text-gray-900"
            }`}
          >
            {name}
          </p>
        )}
        <p
          className={`text-xs mb-3 line-clamp-2 ${
            direction === "outgoing" ? "text-green-50" : "text-gray-600"
          }`}
        >
          {address}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={openInMaps}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              direction === "outgoing"
                ? "bg-white/20 hover:bg-white/30 text-white"
                : "bg-green-50 hover:bg-green-100 text-green-700"
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in Maps</span>
          </button>
          {/* <button
            onClick={() => {
              navigator.clipboard.writeText(`${latitude},${longitude}`);
            }}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              direction === "outgoing"
                ? "bg-white/20 hover:bg-white/30 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
            title="Copy coordinates"
          >
            <Navigation className="w-3.5 h-3.5" />
          </button> */}
        </div>
      </div>
    </div>
  );
};

export default LocationMessage;
