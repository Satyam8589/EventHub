"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function EventDetail({ params }) {
  const [event, setEvent] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Mock event data with gallery and attendees
  const eventsData = [
    {
      id: "1",
      title: "Tech Innovation Summit",
      subtitle: "Where technology meets innovation",
      category: "Technology",
      date: "2024-02-15",
      time: "09:00 AM",
      location: "San Francisco, CA",
      price: 299,
      originalPrice: 399,
      capacity: 500,
      booked: 342,
      featured: true,
      image:
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop",
      description:
        "A premier gathering of tech leaders, innovators, and entrepreneurs. Experience keynote speeches from industry giants, hands-on workshops, networking opportunities, and product launches. Learn about the latest in AI, blockchain, and sustainable technology.",
      highlights: [
        "50+ Expert Speakers",
        "Hands-on Workshops",
        "Networking Sessions",
        "Latest Tech Trends",
      ],
      tags: ["Technology", "Conference", "Networking", "Innovation"],
      organizer: {
        name: "TechCon Global",
        rating: 4.8,
        totalEvents: 24,
        image:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
        email: "contact@techcon.com",
        phone: "+1 (555) 987-6543",
      },
      gallery: {
        photos: [
          "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop",
          "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&h=300&fit=crop",
          "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop",
          "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400&h=300&fit=crop",
          "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400&h=300&fit=crop",
          "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=300&fit=crop",
        ],
        videos: [
          {
            id: 1,
            title: "Event Highlights 2023",
            thumbnail:
              "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop",
            duration: "2:45",
          },
          {
            id: 2,
            title: "Speaker Interviews",
            thumbnail:
              "https://images.unsplash.com/photo-1487017159836-4e23ece2e4cf?w=400&h=300&fit=crop",
            duration: "5:20",
          },
        ],
      },
      attendees: [
        {
          id: 1,
          name: "John Smith",
          title: "CTO at TechCorp",
          image:
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
          company: "TechCorp",
        },
        {
          id: 2,
          name: "Sarah Johnson",
          title: "Product Manager",
          image:
            "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
          company: "Innovation Labs",
        },
        {
          id: 3,
          name: "Mike Chen",
          title: "Software Engineer",
          image:
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
          company: "StartupXYZ",
        },
        {
          id: 4,
          name: "Emily Davis",
          title: "UX Designer",
          image:
            "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
          company: "DesignStudio",
        },
        {
          id: 5,
          name: "Alex Rodriguez",
          title: "Data Scientist",
          image:
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
          company: "DataTech",
        },
        {
          id: 6,
          name: "Lisa Wang",
          title: "Marketing Director",
          image:
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
          company: "GrowthCo",
        },
      ],
    },
    {
      id: "2",
      title: "Digital Marketing Summit",
      category: "Business",
      date: "2024-02-20",
      time: "10:00 AM",
      location: "New York, NY",
      price: 199,
      originalPrice: 299,
      capacity: 300,
      booked: 145,
      image:
        "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop",
      description:
        "Master the latest digital marketing strategies and tools with industry experts.",
      highlights: [
        "SEO Best Practices",
        "Social Media Marketing",
        "Analytics & Insights",
        "ROI Optimization",
      ],
      organizer: {
        name: "Marketing Pro",
        rating: 4.6,
        totalEvents: 18,
        image:
          "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
        email: "contact@marketingpro.com",
        phone: "+1 (555) 123-4567",
      },
    },
    {
      id: "3",
      title: "Design Workshop",
      category: "Design",
      date: "2024-02-25",
      time: "02:00 PM",
      location: "Los Angeles, CA",
      price: 149,
      originalPrice: 199,
      capacity: 150,
      booked: 89,
      image:
        "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop",
      description:
        "Enhance your design skills with hands-on workshops led by creative professionals.",
      highlights: [
        "UI/UX Design",
        "Adobe Creative Suite",
        "Design Thinking",
        "Portfolio Building",
      ],
      organizer: {
        name: "Creative Studio",
        rating: 4.9,
        totalEvents: 32,
        image:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
        email: "contact@creativestudio.com",
        phone: "+1 (555) 789-0123",
      },
    },
  ];

  useEffect(() => {
    const foundEvent =
      eventsData.find((e) => e.id === params.id) || eventsData[0];
    setEvent(foundEvent);
  }, [params.id]);

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const capacityPercentage = (event.booked / event.capacity) * 100;
  const discount = Math.round(
    ((event.originalPrice - event.price) / event.originalPrice) * 100
  );

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-96 h-96 bg-linear-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"
          style={{ left: "20%", top: "10%" }}
        />
        <div
          className="absolute w-80 h-80 bg-linear-to-r from-purple-500/15 to-pink-500/15 rounded-full blur-3xl animate-pulse"
          style={{ right: "10%", bottom: "20%" }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-white">
              EventHub
            </Link>
            <div className="flex space-x-6">
              <Link
                href="/"
                className="text-white/80 hover:text-white transition-colors"
              >
                Home
              </Link>
              <Link
                href="/events"
                className="text-white/80 hover:text-white transition-colors"
              >
                Events
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center space-x-2 text-sm text-white/60">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/events" className="hover:text-white transition-colors">
            Events
          </Link>
          <span>/</span>
          <span className="text-white">{event.title}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Event Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Image */}
            <div className="aspect-video rounded-2xl overflow-hidden bg-white/10 backdrop-blur-md border border-white/20">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Event Header */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="bg-gray-600 text-white px-3 py-1 rounded-full text-sm">
                    {event.category}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button className="text-gray-400 hover:text-white">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </button>
                    <button className="text-gray-400 hover:text-white">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  {event.title}
                </h1>
                <p className="text-gray-300 text-lg mb-4">{event.subtitle}</p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {event.tags?.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-gray-600 text-gray-200 px-3 py-1 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex space-x-1 mb-6 bg-gray-700 rounded-lg p-1">
                {["Overview", "Gallery", "Attendees"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab.toLowerCase())}
                    className={`px-6 py-3 rounded-md text-sm font-medium transition-all ${
                      activeTab === tab.toLowerCase()
                        ? "bg-white text-gray-900"
                        : "text-gray-300 hover:text-white hover:bg-gray-600"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="text-white/80">
                {activeTab === "overview" && (
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">
                      About This Event
                    </h3>
                    <p className="text-gray-300 leading-relaxed mb-6">
                      {event.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-3">
                        <div className="flex items-center text-gray-300">
                          <svg
                            className="w-5 h-5 mr-3 text-blue-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <div>
                            <p className="font-medium text-white">
                              Date & Time
                            </p>
                            <p>
                              {event.date} at {event.time}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center text-gray-300">
                          <svg
                            className="w-5 h-5 mr-3 text-blue-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <div>
                            <p className="font-medium text-white">Location</p>
                            <p>{event.location}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center text-gray-300">
                          <svg
                            className="w-5 h-5 mr-3 text-blue-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                          </svg>
                          <div>
                            <p className="font-medium text-white">Organizer</p>
                            <p>{event.organizer.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center text-gray-300">
                          <svg
                            className="w-5 h-5 mr-3 text-blue-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="font-medium text-white">
                              What You'll Get
                            </p>
                            <ul className="mt-2 space-y-1">
                              {event.highlights
                                .slice(0, 3)
                                .map((highlight, index) => (
                                  <li key={index} className="text-sm">
                                    • {highlight}
                                  </li>
                                ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "gallery" && (
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">
                      Event Gallery
                    </h3>

                    {/* Photos Section */}
                    <div className="mb-8">
                      <h4 className="text-lg font-medium text-white mb-3">
                        Photos
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {event.gallery?.photos.map((photo, index) => (
                          <div
                            key={index}
                            className="aspect-square rounded-lg overflow-hidden bg-gray-700 hover:scale-105 transition-transform duration-200 cursor-pointer"
                          >
                            <img
                              src={photo}
                              alt={`Gallery photo ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Videos Section */}
                    <div>
                      <h4 className="text-lg font-medium text-white mb-3">
                        Videos
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {event.gallery?.videos.map((video) => (
                          <div
                            key={video.id}
                            className="relative aspect-video rounded-lg overflow-hidden bg-gray-700 hover:scale-105 transition-transform duration-200 cursor-pointer group"
                          >
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/60 transition-colors">
                              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                <svg
                                  className="w-6 h-6 text-white ml-1"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-3">
                              <p className="text-white text-sm font-medium">
                                {video.title}
                              </p>
                              <p className="text-gray-300 text-xs">
                                {video.duration}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "attendees" && (
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">
                      Event Attendees
                    </h3>
                    <p className="text-gray-300 mb-6">
                      {event.attendees?.length} people are attending this event
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {event.attendees?.map((attendee) => (
                        <div
                          key={attendee.id}
                          className="bg-gray-700/50 rounded-lg p-4 hover:bg-gray-600/50 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <img
                              src={attendee.image}
                              alt={attendee.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium truncate">
                                {attendee.name}
                              </p>
                              <p className="text-gray-300 text-sm truncate">
                                {attendee.title}
                              </p>
                              <p className="text-gray-400 text-xs truncate">
                                {attendee.company}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Booking Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 sticky top-6">
              {/* Pricing */}
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-3xl font-bold text-white">
                    ${event.price}
                  </span>
                  <span className="text-lg text-white/60 line-through">
                    ${event.originalPrice}
                  </span>
                  <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-sm">
                    {discount}% OFF
                  </span>
                </div>
                <p className="text-white/60 text-sm">per person</p>
              </div>

              {/* Capacity */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/80">Spots Available</span>
                  <span className="text-white">
                    {event.capacity - event.booked}/{event.capacity}
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-linear-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${capacityPercentage}%` }}
                  />
                </div>
                <p className="text-white/60 text-xs mt-1">
                  {Math.round(capacityPercentage)}% filled
                </p>
              </div>

              {/* Booking Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm mb-2">
                    Number of Tickets
                  </label>
                  <select className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white">
                    <option value="1">1 Ticket</option>
                    <option value="2">2 Tickets</option>
                    <option value="3">3 Tickets</option>
                    <option value="4">4 Tickets</option>
                    <option value="5">5 Tickets</option>
                  </select>
                </div>

                <button className="w-full bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105">
                  Book Now
                </button>

                <div className="text-center text-white/60 text-xs">
                  <p>Free cancellation until 24 hours before the event</p>
                </div>
              </div>

              {/* Quick Info */}
              <div className="mt-6 pt-6 border-t border-white/20 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Duration</span>
                  <span className="text-white">8 hours</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Language</span>
                  <span className="text-white">English</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Age Limit</span>
                  <span className="text-white">18+</span>
                </div>
              </div>
            </div>

            {/* Organizer Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 mt-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Organizer
              </h3>

              <div className="flex items-center space-x-4 mb-4">
                <img
                  src={event.organizer.image}
                  alt={event.organizer.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h4 className="text-white font-medium text-lg">
                    {event.organizer.name}
                  </h4>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-gray-300">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <span className="text-sm">
                    {event.organizer?.email || "contact@eventhub.com"}
                  </span>
                </div>

                <div className="flex items-center space-x-3 text-gray-300">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <span className="text-sm">
                    {event.organizer?.phone || "+1 (555) 000-0000"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
