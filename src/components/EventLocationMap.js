"use client";

export default function EventLocationMap({ latitude, longitude, location, venue }) {
  if (!latitude || !longitude) {
    return null; // Don't show anything if coordinates aren't provided
  }

  const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
  const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=600x300&markers=color:red%7C${latitude},${longitude}&key=YOUR_GOOGLE_MAPS_API_KEY`;
  
  // Using OpenStreetMap as a free alternative (no API key required)
  const osmStaticMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(longitude) - 0.01},${parseFloat(latitude) - 0.01},${parseFloat(longitude) + 0.01},${parseFloat(latitude) + 0.01}&layer=mapnik&marker=${latitude},${longitude}`;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <span>📍</span>
          <span>Event Location</span>
        </h3>
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 flex items-center gap-2 shadow-lg"
        >
          <span>🗺️</span>
          <span className="hidden sm:inline">Open in Google Maps</span>
          <span className="sm:hidden">Maps</span>
        </a>
      </div>

      {/* Map Preview */}
      <div className="relative group">
        <div className="relative overflow-hidden rounded-xl border-2 border-white/20 shadow-2xl">
          {/* Interactive Map Embed */}
          <iframe
            src={osmStaticMapUrl}
            className="w-full h-48 md:h-64 rounded-xl"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Event Location Map"
          />
          
          {/* Overlay with click prompt */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6 pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg">
              <p className="text-gray-900 font-semibold text-sm flex items-center gap-2">
                <span>🖱️</span>
                <span>Click "Open in Google Maps" for directions</span>
              </p>
            </div>
          </div>
        </div>

        {/* Coordinates Info */}
        <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
          <span>Coordinates: {latitude}, {longitude}</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${latitude}, ${longitude}`);
              alert('Coordinates copied to clipboard!');
            }}
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Copy
          </button>
        </div>
      </div>
    </>
  );
}
