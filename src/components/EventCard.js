"use client";
import Link from "next/link";
import { useState } from "react";

export default function EventCard({ event }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Check if event is expired
  const isExpired = event.isExpired || false;
  // Format time range display
  const formatTimeRange = (event) => {
    // Use the separate time field instead of extracting from date
    const startTime = event.time;
    const endTime = event.endTime || event.endtime;

    if (!startTime) return null;

    // Format start time to 12-hour format with AM/PM
    const formatTime = (timeValue) => {
      if (!timeValue) return null;

      // If time is already formatted with AM/PM, use it directly
      if (timeValue.includes("AM") || timeValue.includes("PM")) {
        return timeValue;
      }

      // If time is in 24-hour format (HH:MM or HH:MM:SS), convert to 12-hour with AM/PM
      const timeParts = timeValue.split(":");
      if (timeParts.length >= 2) {
        let hours = parseInt(timeParts[0]);
        const minutes = timeParts[1];
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 should be 12
        return `${hours}:${minutes} ${ampm}`;
      }

      return timeValue;
    };

    const formattedStartTime = formatTime(startTime);
    const formattedEndTime = formatTime(endTime);

    // If we have both start and end times and they're different, show range
    if (
      formattedStartTime &&
      formattedEndTime &&
      formattedStartTime !== formattedEndTime
    ) {
      return `${formattedStartTime} - ${formattedEndTime}`;
    }

    // Otherwise just show start time
    return formattedStartTime;
  };

  const bookedTickets = event._count?.bookings ?? event.registered ?? 0;
  const capacity = event.capacity || 0;

  const capacityPercentage =
    capacity > 0
      ? Math.min((bookedTickets / capacity) * 100, 100).toFixed(0)
      : 0;
  const spotsLeft = Math.max(capacity - bookedTickets, 0);

  // Check if event is sold out
  const isSoldOut = capacity > 0 && spotsLeft === 0;

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
      className={`bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group relative ${
        event.featured
          ? "ring-2 ring-amber-400/60 shadow-amber-500/30 shadow-2xl"
          : ""
      } ${isExpired ? "opacity-75 grayscale-[0.3]" : ""}`}
    >
      {/* Featured Badge */}
      {event.featured && (
        <div className="absolute top-3 right-3 z-20 bg-linear-to-r from-amber-400 via-yellow-500 to-amber-600 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg border border-yellow-300/50 animate-pulse">
          <span className="text-sm">⭐</span>
          <span className="tracking-wide">FEATURED</span>
        </div>
      )}

      {/* Event Image with Overlay */}
      <div className="relative h-52 sm:h-56 overflow-hidden">
        {imageLoading && (
          <div className="absolute inset-0 bg-linear-to-br from-gray-200 to-gray-300 animate-pulse"></div>
        )}
        <img
          src={imageError ? getBackgroundImage(event.category) : imageUrl}
          alt={event.title}
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:rotate-1"
          onError={(e) => {
            console.error("Image failed to load:", imageUrl);
            setImageError(true);
            setImageLoading(false);
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
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent"></div>

        {/* Category Badge */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md text-gray-800 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
          {event.category}
        </div>

        {/* Gallery Indicator */}
        {event.gallery && event.gallery.length > 0 && (
          <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm text-white px-2.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-lg">
            {event.gallery.some((item) => item.type === "video") ? (
              <span>🎬</span>
            ) : (
              <span>🖼️</span>
            )}
            <span>{event.gallery.length}</span>
          </div>
        )}

        {/* Event Title Overlay on Image */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-1 line-clamp-2 drop-shadow-lg">
            {event.title}
          </h3>
        </div>

        {/* Expired Event Overlay */}
        {isExpired && (
          <div className="absolute top-2 left-2 bg-red-600/90 text-white px-3 py-1.5 rounded-lg text-sm font-bold backdrop-blur-sm border border-red-500/50 shadow-lg">
            <span className="flex items-center gap-1.5">
              <span>🚫</span>
              <span className="tracking-wide">EXPIRED</span>
            </span>
          </div>
        )}
      </div>

      {/* Event Details */}
      <div className="p-4 sm:p-5">
        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
          {event.description}
        </p>

        {/* Organizer */}
        {(event.organizerName || event.organizer?.name) && (
          <div className="flex items-center justify-between mb-3 text-sm">
            <span className="text-gray-500">Organizer:</span>
            <span className="text-gray-700 font-medium">
              {event.organizerName || event.organizer?.name}
            </span>
          </div>
        )}

        {/* Date and Time Information - Compact Design */}
        <div className="space-y-1.5 mb-4">
          {/* Starting Date & Time */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-blue-500 shrink-0">🚀</span>
            <div className="flex-1 min-w-0 flex items-center justify-between">
              {event.date ? (
                <div className="flex items-center gap-1 text-gray-700 font-medium text-xs">
                  <span>
                    {new Date(event.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  {event.time && (
                    <span className="text-gray-500">
                      •{" "}
                      {(() => {
                        const time = event.time;
                        if (time.includes("AM") || time.includes("PM")) {
                          return time;
                        }
                        const timeParts = time.split(":");
                        if (timeParts.length >= 2) {
                          let hours = parseInt(timeParts[0]);
                          const minutes = timeParts[1];
                          const ampm = hours >= 12 ? "PM" : "AM";
                          hours = hours % 12;
                          hours = hours ? hours : 12;
                          return `${hours}:${minutes} ${ampm}`;
                        }
                        return time;
                      })()}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-gray-500 text-xs">Date TBD</span>
              )}
              {(() => {
                // Smart expired logic that considers start time, end date, and end time
                const now = new Date();
                let isExpired = false;

                // If we have an end date, use that to determine if expired
                if (event.endDate || event.enddate) {
                  const endDate = new Date(event.endDate || event.enddate);

                  // If we also have an end time, combine them
                  if (event.endTime || event.endtime) {
                    const endTime = event.endTime || event.endtime;
                    const timeParts = endTime.split(":");
                    if (timeParts.length >= 2) {
                      endDate.setHours(
                        parseInt(timeParts[0]),
                        parseInt(timeParts[1]),
                        0,
                        0
                      );
                    }
                  } else {
                    // If no end time specified, assume end of day
                    endDate.setHours(23, 59, 59, 999);
                  }

                  isExpired = now > endDate;
                } else if (event.date) {
                  // No end date, so check if it's past the start date
                  const eventDate = new Date(event.date);

                  // If we have a start time, use it
                  if (event.time) {
                    const timeParts = event.time.split(":");
                    if (timeParts.length >= 2) {
                      // For single-day events without end time, assume 8-hour duration
                      const startHours = parseInt(timeParts[0]);
                      const startMinutes = parseInt(timeParts[1]);
                      eventDate.setHours(startHours + 8, startMinutes, 0, 0); // Add 8 hours
                    } else {
                      // No valid time, assume end of day
                      eventDate.setHours(23, 59, 59, 999);
                    }
                  } else {
                    // No time specified, assume end of day
                    eventDate.setHours(23, 59, 59, 999);
                  }

                  isExpired = now > eventDate;
                }

                return isExpired ? (
                  <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs rounded font-medium">
                    Expired
                  </span>
                ) : null;
              })()}
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-purple-500 shrink-0">📍</span>
            <span className="text-gray-600 text-xs line-clamp-1 flex-1 min-w-0">
              {event.location}
            </span>
          </div>
        </div>

        {/* Attendees Info - Compact Design */}
        <div className="flex items-center gap-2 mb-4 text-sm">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-full">
            <span className="text-blue-600">👥</span>
            <span className="text-blue-700 font-semibold">
              {bookedTickets}/{capacity}
            </span>
            <span className="text-blue-600 text-xs">registered</span>
          </div>
          <div className="flex-1 text-right">
            <span
              className={`text-xs font-medium ${
                spotsLeft > 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {spotsLeft > 0 ? `${spotsLeft} spots left` : "Sold Out"}
            </span>
          </div>
        </div>

        {/* Capacity Bar - Sleeker Design */}
        <div className="mb-4">
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                spotsLeft === 0
                  ? "bg-linear-to-r from-red-500 to-red-600"
                  : spotsLeft <= capacity * 0.1
                  ? "bg-linear-to-r from-orange-500 to-orange-600"
                  : "bg-linear-to-r from-blue-500 via-purple-500 to-pink-500"
              }`}
              style={{ width: `${capacityPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center text-xs text-gray-500 mt-1.5">
            <span>
              {bookedTickets}/{capacity}
            </span>
            <span>{capacityPercentage}% filled</span>
          </div>
        </div>

        {/* Price and Action - Modern Layout */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Price</div>
            <div className="text-2xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ₹{event.price?.toLocaleString("en-IN")}
            </div>
          </div>

          {isSoldOut ? (
            <div className="px-6 py-2.5 rounded-xl text-sm font-semibold text-center">
              <div className="bg-red-100 text-red-600 px-4 py-2 rounded-lg">
                <div className="font-bold">Sold Out</div>
                <div className="text-xs mt-1">May be upgraded later</div>
              </div>
            </div>
          ) : isExpired ? (
            <Link
              href={`/events/${event.id}`}
              className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 inline-block text-center"
            >
              View Details
            </Link>
          ) : (
            <Link
              href={`/events/${event.id}`}
              className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl inline-block text-center"
            >
              Book Now
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
