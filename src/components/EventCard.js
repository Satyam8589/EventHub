"use client";

export default function EventCard({ event }) {
  const capacityPercentage = (
    (event.registered / event.capacity) *
    100
  ).toFixed(0);
  const spotsLeft = event.capacity - event.registered;

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

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] group">
      {/* Featured Badge */}
      {event.featured && (
        <div className="absolute top-3 right-3 z-10 bg-black/90 text-white px-3 py-1 rounded-md text-xs font-medium">
          Featured
        </div>
      )}

      {/* Event Image */}
      <div className="relative h-48 overflow-hidden">
        <div
          className="w-full h-full bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
          style={{
            backgroundImage: `url(${
              event.imageUrl || getBackgroundImage(event.category)
            })`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/40"></div>

          {/* Category Badge */}
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-gray-800 px-2 py-1 rounded-md text-xs font-medium">
            {event.category}
          </div>
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
              <span>{event.registered} registered</span>
            </span>
            <span>{spotsLeft} spots left</span>
          </div>

          {/* Capacity Bar */}
          <div>
            <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
              <span>Capacity</span>
              <span>{capacityPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-linear-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${capacityPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Price and Action */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xl font-bold text-gray-900">${event.price}</div>
          <a
            href={`/events/${event.id}`}
            className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 inline-block text-center"
          >
            View Details
          </a>
        </div>
      </div>
    </div>
  );
}
