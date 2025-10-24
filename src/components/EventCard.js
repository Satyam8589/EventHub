"use client";
import Link from "next/link";
import { useState } from "react";

export default function EventCard({ event }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const registered = event.registered || 0;
  const capacity = event.capacity || 0;

  const capacityPercentage =
    capacity > 0 ? Math.min((registered / capacity) * 100, 100).toFixed(0) : 0;
  const spotsLeft = Math.max(capacity - registered, 0);

  // Debug logging for image URL
  if (process.env.NODE_ENV === "development") {
    console.log("EventCard Debug:", {
      eventId: event.id,
      eventTitle: event.title,
      imageUrl: event.imageUrl,
      gallery: event.gallery,
      category: event.category,
    });
  }

  // Define background images for different categories
  const getBackgroundImage = (category) => {
    const images = {
      Music:
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      Technology:
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "Food & Drink":
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "Art & Culture":
        "https://images.unsplash.com/photo-1578321272176-b7bbc0679853?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      Business:
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "Health & Wellness":
        "https://images.unsplash.com/photo-1506629905607-45c9e2dd4e8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      Gaming:
        "https://images.unsplash.com/photo-1511512578047-dfb367046420?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      Education:
        "https://images.unsplash.com/photo-1497486751825-1233686d5d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      Entertainment:
        "https://images.unsplash.com/photo-1574391884720-bbc9d0bca4f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    };
    return (
      images[category] ||
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    );
  };

  // Determine the best image URL to use
  const getImageUrl = () => {
    // Priority: event.imageUrl -> gallery[0].url -> category background
    if (event.imageUrl && event.imageUrl.trim() !== "") {
      // Check if it's a valid URL
      try {
        new URL(event.imageUrl);
        if (process.env.NODE_ENV === "development") {
          console.log("Using event.imageUrl:", event.imageUrl);
        }
        return event.imageUrl;
      } catch (e) {
        console.error("Invalid imageUrl format:", event.imageUrl);
      }
    }

    if (
      event.gallery &&
      event.gallery.length > 0 &&
      event.gallery[0].type === "image" &&
      event.gallery[0].url
    ) {
      if (process.env.NODE_ENV === "development") {
        console.log("Using gallery image:", event.gallery[0].url);
      }
      return event.gallery[0].url;
    }

    const fallbackImage = getBackgroundImage(event.category);
    if (process.env.NODE_ENV === "development") {
      console.log(
        "Using fallback image for category",
        event.category,
        ":",
        fallbackImage
      );
    }
    return fallbackImage;
  };

  const imageUrl = getImageUrl();

  return (
    <div
      className={`bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] group relative ${
        event.featured
          ? "ring-2 ring-amber-400/50 shadow-amber-500/20 shadow-xl"
          : ""
      }`}
    >
      {/* Featured Badge */}
      {event.featured && (
        <div className="absolute top-2 right-2 z-20 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg border border-yellow-300/50 animate-pulse">
          <span className="text-sm">⭐</span>
          <span className="tracking-wide">FEATURED</span>
        </div>
      )}

      {/* Featured Golden Shimmer Overlay */}
      {event.featured && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200/10 to-transparent animate-shimmer"></div>
        </div>
      )}

      {/* Gallery Indicator */}
      {event.gallery && event.gallery.length > 0 && (
        <div className="absolute bottom-3 right-3 z-10 bg-black/70 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
          <span>🖼️</span>
          {event.gallery.length}
        </div>
      )}

      {/* Event Image */}
      <div className="relative h-48 overflow-hidden">
        {imageLoading && (
          <div className="absolute inset-0 bg-gray-300 animate-pulse"></div>
        )}
        <img
          src={imageError ? getBackgroundImage(event.category) : imageUrl}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          onError={(e) => {
            console.error("Image failed to load:", imageUrl);
            setImageError(true);
            setImageLoading(false);
            // Prevent infinite loop by checking if already using fallback
            if (!imageError) {
              e.target.src = getBackgroundImage(event.category);
            }
          }}
          onLoad={() => {
            setImageLoading(false);
            if (process.env.NODE_ENV === "development") {
              console.log("Image loaded successfully:", imageUrl);
            }
          }}
        />
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40"></div>

        {/* Category Badge */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-gray-800 px-2 py-1 rounded-md text-xs font-medium">
          {event.category}
        </div>
      </div>

      {/* Event Details */}
      <div className="p-5">
        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {event.title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {event.description}
        </p>

        {/* Date and Location */}
        <div className="space-y-2 mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">📅</span>
            <span>{event.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">📍</span>
            <span className="line-clamp-1">{event.location}</span>
          </div>
        </div>

        {/* Registration Stats */}
        <div className="mb-4">
          <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
            <span className="flex items-center gap-1">
              <span className="text-gray-400">👥</span>
              <span>{event.registered || 0} attendees</span>
            </span>
            <span>
              {spotsLeft > 0 ? `${spotsLeft} spots left` : "Sold out"}
            </span>
          </div>

          {/* Capacity Bar */}
          <div>
            <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
              <span>
                Capacity: {registered}/{capacity}
              </span>
              <span>{capacityPercentage}% full</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  spotsLeft === 0
                    ? "bg-red-500"
                    : spotsLeft <= capacity * 0.1
                    ? "bg-orange-500"
                    : "bg-linear-to-r from-blue-500 to-purple-600"
                }`}
                style={{ width: `${capacityPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Price and Action */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xl font-bold text-gray-900">
            ₹{event.price?.toLocaleString("en-IN")}
          </div>
          <Link
            href={`/events/${event.id}`}
            className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 inline-block text-center"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
