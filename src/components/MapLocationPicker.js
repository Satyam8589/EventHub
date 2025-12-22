"use client";
import { useState, useEffect } from "react";

export default function MapLocationPicker({ latitude, longitude, onLocationChange }) {
  const [localLat, setLocalLat] = useState(latitude || "");
  const [localLng, setLocalLng] = useState(longitude || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // Update local state when props change
  useEffect(() => {
    setLocalLat(latitude || "");
    setLocalLng(longitude || "");
  }, [latitude, longitude]);

  // Search for location using our API route (which calls Nominatim)
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults([]);
    
    try {
      const response = await fetch(
        `/api/location-search?q=${encodeURIComponent(searchQuery)}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Search failed');
      }
      
      const data = await response.json();
      
      if (data.length === 0) {
        alert(`No results found for "${searchQuery}". Try:\n• Being more specific (e.g., "Times Square, New York")\n• Including city and country\n• Using a landmark name`);
      } else {
        setSearchResults(data);
      }
    } catch (error) {
      console.error("Error searching location:", error);
      alert(`Failed to search location: ${error.message}\n\nYou can still:\n• Try a different search term\n• Enter coordinates manually below`);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle selecting a search result
  const handleSelectLocation = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setLocalLat(lat);
    setLocalLng(lng);
    onLocationChange(lat, lng);
    setSearchResults([]);
    setSearchQuery("");
  };

  // Handle manual coordinate input
  const handleManualInput = (type, value) => {
    if (type === "lat") {
      setLocalLat(value);
      if (value && localLng) {
        onLocationChange(parseFloat(value), parseFloat(localLng));
      }
    } else {
      setLocalLng(value);
      if (localLat && value) {
        onLocationChange(parseFloat(localLat), parseFloat(value));
      }
    }
  };

  const mapUrl = localLat && localLng
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(localLng) - 0.01},${parseFloat(localLat) - 0.01},${parseFloat(localLng) + 0.01},${parseFloat(localLat) + 0.01}&layer=mapnik&marker=${localLat},${localLng}`
    : null;

  return (
    <div className="space-y-4 p-5 bg-gradient-to-br from-green-500/10 via-blue-500/10 to-purple-500/10 rounded-xl border border-green-500/30">
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="text-3xl">📍</span>
        <div className="flex-1">
          <h3 className="text-white font-semibold text-lg mb-1">
            Event Location on Map
          </h3>
          <p className="text-white/70 text-sm">
            Search for a location or enter coordinates manually to show a map on the event page.
          </p>
        </div>
      </div>

      {/* Location Search */}
      <div className="space-y-3">
        <label className="block text-white font-medium text-sm">
          🔍 Search Location
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search for a place (e.g., Times Square, New York)"
            className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="bg-white/5 border border-white/20 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
            {searchResults.map((result, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectLocation(result)}
                className="w-full text-left px-4 py-3 hover:bg-white/10 transition-colors border-b border-white/10 last:border-b-0"
              >
                <div className="text-white font-medium text-sm">
                  {result.display_name}
                </div>
                <div className="text-gray-400 text-xs mt-1">
                  📍 {parseFloat(result.lat).toFixed(6)}, {parseFloat(result.lon).toFixed(6)}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Manual Coordinate Input */}
      <div className="pt-4 border-t border-white/20">
        <label className="block text-white font-medium text-sm mb-3">
          ✏️ Or Enter Coordinates Manually
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-white/80 text-xs">Latitude</label>
            <input
              type="number"
              value={localLat}
              onChange={(e) => handleManualInput("lat", e.target.value)}
              step="any"
              placeholder="e.g., 40.7128"
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-white/80 text-xs">Longitude</label>
            <input
              type="number"
              value={localLng}
              onChange={(e) => handleManualInput("lng", e.target.value)}
              step="any"
              placeholder="e.g., -74.0060"
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {/* Map Preview */}
      {mapUrl && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-white font-medium text-sm">
              🗺️ Map Preview
            </label>
            <a
              href={`https://www.google.com/maps?q=${localLat},${localLng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-xs underline"
            >
              Open in Google Maps ↗
            </a>
          </div>
          <div className="relative overflow-hidden rounded-xl border-2 border-white/20 shadow-lg">
            <iframe
              src={mapUrl}
              className="w-full h-64 rounded-xl"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              title="Location Preview"
            />
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            <p className="text-green-300 text-sm flex items-center gap-2">
              <span>✓</span>
              <span>
                Location set: {parseFloat(localLat).toFixed(6)}, {parseFloat(localLng).toFixed(6)}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-blue-300 text-xs leading-relaxed">
          <strong>💡 Tips:</strong>
          <br />
          • Search for your venue name or address to find it quickly
          <br />
          • Or right-click on Google Maps and copy the coordinates
          <br />
          • The map will be displayed on the event detail page for attendees
        </p>
      </div>
    </div>
  );
}
