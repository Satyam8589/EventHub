"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export default function EventCard({ event }) {
  const { user } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [userTotalTickets, setUserTotalTickets] = useState(0);
  const [loadingBookings, setLoadingBookings] = useState(true);

  useEffect(() => {
    console.log("EventCard: User or event changed:", { user, event });
    if (user && event) {
      const fetchUserBookings = async () => {
        console.log("EventCard: Fetching user bookings...");
        setLoadingBookings(true);
        const { data, error } = await supabase
          .from("bookings")
          .select("tickets")
          .eq("eventId", event.id)
          .eq("userId", user.uid)
          .eq("status", "CONFIRMED");

        if (error) {
          console.error("EventCard: Error fetching user bookings:", error);
        } else {
          const totalTickets = data.reduce(
            (sum, booking) => sum + booking.tickets,
            0
          );
          console.log("EventCard: User total tickets:", totalTickets);
          setUserTotalTickets(totalTickets);
        }
        setLoadingBookings(false);
      };

      fetchUserBookings();
    } else {
      setLoadingBookings(false);
    }
  }, [user, event]);

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

  // ✅ Event status calculation with IST timezone handling
  // Helper to ensure proper UTC format
  const ensureUTCString = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr.includes("T") && dateStr.endsWith("Z")) return dateStr;
    if (dateStr.includes("T")) return dateStr + "Z";
    return dateStr.replace(" ", "T") + "Z";
  };

  const startDate = event?.date ? new Date(ensureUTCString(event.date)) : null;
  const rawEnd = event?.endDate || event?.enddate || null;
  const endDate = rawEnd
    ? new Date(ensureUTCString(rawEnd))
    : startDate
    ? new Date(startDate.getTime() + 24 * 60 * 60 * 1000)
    : null;

  // Get current time in IST
  const nowIST = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );

  // Create event start datetime in IST
  let eventStartIST = null;
  let hasEventStarted = false;

  if (startDate && event.time) {
    try {
      // Get current time
      const now = new Date();

      // Parse event date (stored as UTC in database)
      const eventDateUTC = new Date(event.date);

      // Convert to IST date string and parse back
      const eventDateISTString = eventDateUTC.toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

      // Parse the IST date string (format: MM/DD/YYYY)
      const [month, day, year] = eventDateISTString
        .split("/")
        .map((num) => parseInt(num));

      // Parse event time
      let hours = 0,
        minutes = 0;
      const timeStr = event.time;

      if (timeStr.includes("AM") || timeStr.includes("PM")) {
        // 12-hour format
        const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (match) {
          hours = parseInt(match[1]);
          minutes = parseInt(match[2]);
          const period = match[3].toUpperCase();
          if (period === "PM" && hours !== 12) hours += 12;
          if (period === "AM" && hours === 12) hours = 0;
        }
      } else {
        // 24-hour format
        const parts = timeStr.split(":");
        if (parts.length >= 2) {
          hours = parseInt(parts[0]);
          minutes = parseInt(parts[1]);
        }
      }

      // Create event start datetime in IST (month is 0-indexed)
      eventStartIST = new Date(year, month - 1, day, hours, minutes, 0);

      // Get current time in IST
      const nowISTString = now.toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

      // Parse current IST time
      const [datePartNow, timePartNow] = nowISTString.split(", ");
      const [monthNow, dayNow, yearNow] = datePartNow
        .split("/")
        .map((num) => parseInt(num));
      const [hoursNow, minutesNow, secondsNow] = timePartNow
        .split(":")
        .map((num) => parseInt(num));
      const nowISTDate = new Date(
        yearNow,
        monthNow - 1,
        dayNow,
        hoursNow,
        minutesNow,
        secondsNow
      );

      // Check if event has started
      hasEventStarted = nowISTDate >= eventStartIST;
    } catch (error) {
      console.error("EventCard: Error calculating event start time:", error);
      hasEventStarted = false;
    }
  }

  // Create event end datetime in IST for proper end time checking
  let eventEndIST = null;
  let hasEventEnded = false;

  if (endDate && (event.endTime || event.endtime)) {
    try {
      // Convert end date UTC to IST date string
      const eventEndDateISTString = endDate.toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

      // Parse the IST date string (format: MM/DD/YYYY)
      const [endMonth, endDay, endYear] = eventEndDateISTString
        .split("/")
        .map((num) => parseInt(num));

      // Parse event end time
      let endHours = 0,
        endMinutes = 0;
      const endTimeStr = event.endTime || event.endtime;

      if (endTimeStr.includes("AM") || endTimeStr.includes("PM")) {
        // 12-hour format
        const match = endTimeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (match) {
          endHours = parseInt(match[1]);
          endMinutes = parseInt(match[2]);
          const period = match[3].toUpperCase();
          if (period === "PM" && endHours !== 12) endHours += 12;
          if (period === "AM" && endHours === 12) endHours = 0;
        }
      } else {
        // 24-hour format
        const parts = endTimeStr.split(":");
        if (parts.length >= 2) {
          endHours = parseInt(parts[0]);
          endMinutes = parseInt(parts[1]);
        }
      }

      // Create event end datetime in IST (month is 0-indexed)
      eventEndIST = new Date(
        endYear,
        endMonth - 1,
        endDay,
        endHours,
        endMinutes,
        0
      );

      // Get current time in IST
      const now = new Date();
      const nowISTString = now.toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

      // Parse current IST time
      const [datePartNow, timePartNow] = nowISTString.split(", ");
      const [monthNow, dayNow, yearNow] = datePartNow
        .split("/")
        .map((num) => parseInt(num));
      const [hoursNow, minutesNow, secondsNow] = timePartNow
        .split(":")
        .map((num) => parseInt(num));
      const nowISTDate = new Date(
        yearNow,
        monthNow - 1,
        dayNow,
        hoursNow,
        minutesNow,
        secondsNow
      );

      // Check if event has ended
      hasEventEnded = nowISTDate > eventEndIST;
    } catch (error) {
      console.error("EventCard: Error calculating event end time:", error);
      hasEventEnded = false;
    }
  }

  // Determine event status
  const isUpcoming = startDate && nowIST < startDate;
  const isOngoing =
    startDate &&
    endDate &&
    nowIST >= startDate &&
    nowIST <= endDate &&
    !hasEventEnded;
  const isPast = hasEventEnded || (endDate && nowIST > endDate);

  // Status badge configuration
  const statusBadge = isOngoing
    ? {
        text: "ONGOING",
        classes: "from-green-500 to-emerald-600 border-green-300/50",
      }
    : isUpcoming
    ? {
        text: "UPCOMING",
        classes: "from-blue-500 to-cyan-600 border-blue-300/50",
      }
    : isPast
    ? { text: "PAST", classes: "from-gray-500 to-gray-600 border-gray-300/50" }
    : null;
  const statusTopClass = event.featured ? "top-11" : "top-3";

  const hasBookingLimit =
    event.max_tickets_per_user && event.max_tickets_per_user > 0;
  const userReachedLimit =
    hasBookingLimit && userTotalTickets >= event.max_tickets_per_user;

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
    <Link href={`/events/${event.id}`} className="block">
      <div
        className={`bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group relative cursor-pointer ${
          event.featured
            ? "ring-2 ring-amber-400/60 shadow-amber-500/30 shadow-2xl"
            : ""
        } ${isExpired ? "opacity-75 grayscale-[0.3]" : ""}`}
      >
        {/* Status Badge - Smaller size */}
        {statusBadge && (
          <div
            className={`absolute ${statusTopClass} right-3 z-30 bg-gradient-to-r ${statusBadge.classes} text-white px-2 py-1 rounded-full text-[8px] sm:text-[10px] font-bold shadow-lg border`}
          >
            <span className="tracking-wide">{statusBadge.text}</span>
          </div>
        )}
        {/* Featured Badge - Star only */}
        {event.featured && (
          <div className="absolute top-3 right-3 z-20 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-white w-6 h-6 rounded-full shadow-lg border border-yellow-300/50 animate-pulse flex items-center justify-center">
            <span className="text-xs">⭐</span>
          </div>
        )}

        {/* Event Image with Overlay */}
        <div className="relative h-52 sm:h-56 overflow-hidden">
          {imageLoading && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse"></div>
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

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
                      {(() => {
                        // Ensure proper UTC parsing for database dates
                        const dateStr =
                          event.date.includes("T") && event.date.includes("Z")
                            ? event.date
                            : event.date.includes("T")
                            ? event.date + "Z"
                            : event.date.replace(" ", "T") + "Z";

                        const eventDate = new Date(dateStr);

                        // Convert to IST and display
                        return eventDate.toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          timeZone: "Asia/Kolkata",
                        });
                      })()}
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
                    ? "bg-gradient-to-r from-red-500 to-red-600"
                    : spotsLeft <= capacity * 0.1
                    ? "bg-gradient-to-r from-orange-500 to-orange-600"
                    : "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
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
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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
            ) : isPast ? (
              <div className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 text-center">
                Event Ended
              </div>
            ) : isExpired ? (
              <div className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 text-center">
                View Details
              </div>
            ) : (
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-center">
                Details
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
