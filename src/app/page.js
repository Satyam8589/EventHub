"use client";
import { useState, useEffect } from "react";
import EventCard from "../components/EventCard";

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const events = [
    {
      id: 1,
      title: "Summer Music Festival 2025",
      description: "Three days of incredible music, art, and community",
      date: "July 15, 2025 at 14:00",
      location: "Central Park, New York",
      price: 299,
      category: "Music",
      registered: 3847,
      capacity: 5000,
      featured: true,
      imageUrl: null, // Will use gradient background
    },
    {
      id: 2,
      title: "Tech Innovation Summit",
      description:
        "Discover the latest in AI, blockchain, and emerging technologies",
      date: "January 20, 2025 at 09:00",
      location: "Moscone Center, San Francisco",
      price: 499,
      category: "Technology",
      registered: 1250,
      capacity: 1500,
      featured: false,
      imageUrl: null,
    },
    {
      id: 3,
      title: "International Food & Wine Festival",
      description: "A culinary journey around the world with master chefs",
      date: "February 5, 2025 at 18:00",
      location: "Navy Pier, Chicago",
      price: 149,
      category: "Food & Drink",
      registered: 890,
      capacity: 1200,
      featured: true,
      imageUrl: null,
    },
    {
      id: 4,
      title: "Digital Art & Design Expo",
      description:
        "Showcase of contemporary digital art and interactive installations",
      date: "March 10, 2025 at 10:00",
      location: "LACMA, Los Angeles",
      price: 75,
      category: "Art & Culture",
      registered: 456,
      capacity: 800,
      featured: false,
      imageUrl: null,
    },
    {
      id: 5,
      title: "Startup Pitch Competition",
      description:
        "Watch innovative startups compete for venture capital funding",
      date: "April 15, 2025 at 13:00",
      location: "Austin Convention Center, Texas",
      price: 199,
      category: "Business",
      registered: 678,
      capacity: 1000,
      featured: false,
      imageUrl: null,
    },
    {
      id: 6,
      title: "Wellness & Mindfulness Retreat",
      description:
        "A weekend of yoga, meditation, and holistic wellness practices",
      date: "May 20, 2025 at 08:00",
      location: "Sedona, Arizona",
      price: 350,
      category: "Health & Wellness",
      registered: 234,
      capacity: 300,
      featured: true,
      imageUrl: null,
    },
    {
      id: 7,
      title: "Gaming Championship 2025",
      description: "The ultimate esports tournament with top players worldwide",
      date: "June 10, 2025 at 16:00",
      location: "MGM Grand, Las Vegas",
      price: 125,
      category: "Gaming",
      registered: 1890,
      capacity: 2500,
      featured: false,
      imageUrl: null,
    },
    {
      id: 8,
      title: "Photography Workshop",
      description: "Master the art of landscape and portrait photography",
      date: "July 5, 2025 at 10:00",
      location: "Yosemite National Park",
      price: 199,
      category: "Education",
      registered: 67,
      capacity: 80,
      featured: false,
      imageUrl: null,
    },
    {
      id: 9,
      title: "Blockchain & Crypto Conference",
      description: "Explore the future of decentralized finance and Web3",
      date: "August 15, 2025 at 09:00",
      location: "Miami Beach Convention Center",
      price: 599,
      category: "Technology",
      registered: 2100,
      capacity: 3000,
      featured: false,
      imageUrl: null,
    },
    {
      id: 10,
      title: "International Comedy Festival",
      description: "Laugh out loud with world-renowned comedians",
      date: "September 22, 2025 at 19:00",
      location: "Madison Square Garden, NYC",
      price: 89,
      category: "Entertainment",
      registered: 4500,
      capacity: 5000,
      featured: true,
      imageUrl: null,
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating particles */}
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-20 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}

        {/* Moving gradient orbs */}
        <div
          className="absolute w-96 h-96 bg-linear-to-r from-blue-400 to-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${
              mousePosition.y * 0.02
            }px)`,
          }}
        />
        <div
          className="absolute w-96 h-96 bg-linear-to-r from-yellow-400 to-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000 top-20 right-20"
          style={{
            transform: `translate(${mousePosition.x * -0.01}px, ${
              mousePosition.y * -0.01
            }px)`,
          }}
        />
        <div
          className="absolute w-96 h-96 bg-linear-to-r from-green-400 to-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000 bottom-20 left-20"
          style={{
            transform: `translate(${mousePosition.x * 0.015}px, ${
              mousePosition.y * 0.015
            }px)`,
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-linear-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          <span className="text-white font-bold text-xl">EventHub</span>
        </div>

        <div className="hidden md:flex items-center space-x-8 text-white/80">
          <a href="/" className="hover:text-white transition-colors">
            Home
          </a>
          <a href="/events" className="hover:text-white transition-colors">
            Events
          </a>
          <a href="#" className="hover:text-white transition-colors">
            My Events
          </a>
          <a href="#" className="hover:text-white transition-colors">
            About
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Contact
          </a>
        </div>

        <button className="bg-linear-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
          Sign Up
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 text-center py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 animate-fade-in-up">
            Discover Amazing Events Near You
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto animate-fade-in-up animation-delay-300">
            Join thousands of people experiencing the best events in music,
            food, technology, and community. Book your next adventure today!
          </p>

          {/* Search Bar */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 max-w-2xl mx-auto mb-12 animate-fade-in-up animation-delay-600">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                placeholder="Search events, artists, venues..."
                className="w-full px-6 py-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </div>
            </div>
            <button className="bg-linear-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-xl font-semibold">
              Search
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-900">
            <button className="bg-white text-gray-900 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-xl">
              Browse Events
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold hover:bg-white hover:text-gray-900 transition-all duration-300 transform hover:scale-105">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <div className="text-4xl mb-4">🎪</div>
              <div className="text-3xl font-bold text-white mb-2">10,000+</div>
              <div className="text-gray-300">Events Listed</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <div className="text-4xl mb-4">👥</div>
              <div className="text-3xl font-bold text-white mb-2">500K+</div>
              <div className="text-gray-300">Happy Attendees</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <div className="text-4xl mb-4">⭐</div>
              <div className="text-3xl font-bold text-white mb-2">4.9/5</div>
              <div className="text-gray-300">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="relative z-10 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            Explore by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: "Music", icon: "🎵", color: "from-pink-500 to-rose-500" },
              {
                name: "Business",
                icon: "💼",
                color: "from-blue-500 to-cyan-500",
              },
              {
                name: "Food & Drink",
                icon: "🍕",
                color: "from-orange-500 to-amber-500",
              },
              {
                name: "Art & Culture",
                icon: "🎨",
                color: "from-purple-500 to-indigo-500",
              },
            ].map((category, index) => (
              <div
                key={category.name}
                className={`bg-linear-to-br ${category.color} rounded-2xl p-6 text-center cursor-pointer transform hover:scale-105 transition-all duration-300 hover:shadow-2xl`}
              >
                <div className="text-4xl mb-3">{category.icon}</div>
                <h3 className="text-white font-semibold text-lg">
                  {category.name}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="relative z-10 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Featured Events
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Don't miss out on these incredible experiences
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {events
              .filter((event) => event.featured)
              .slice(0, 3)
              .map((event, index) => (
                <div
                  key={event.id}
                  style={{ animationDelay: `${index * 200}ms` }}
                  className="animate-fade-in-up"
                >
                  <EventCard event={event} />
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="relative z-10 py-16 bg-black/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Upcoming Events
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Discover more amazing events happening soon
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {events
              .filter((event) => !event.featured)
              .slice(0, 3)
              .map((event, index) => (
                <div
                  key={event.id}
                  style={{ animationDelay: `${index * 200}ms` }}
                  className="animate-fade-in-up"
                >
                  <EventCard event={event} />
                </div>
              ))}
          </div>

          <div className="text-center mt-12">
            <button className="bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105 font-semibold">
              View All Events
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-5xl font-bold text-white mb-6">
            Ready to Create Unforgettable Memories?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join EventHub today and get exclusive access to events, early-bird
            discounts, and personalized recommendations.
          </p>
          <button className="bg-linear-to-r from-blue-600 to-purple-600 text-white px-12 py-4 rounded-full text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-2xl">
            Start Exploring
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-black/30 backdrop-blur-md border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-gray-300">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-linear-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">E</span>
                </div>
                <span className="text-white font-bold text-xl">EventHub</span>
              </div>
              <p className="text-sm">
                Discover and book amazing events near you. Create memories that
                last forever.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    My Events
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Favorites
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Calendar
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Settings
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Categories</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Music
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Technology
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Food & Drink
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Sports
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Contact Us</h4>
              <p className="text-sm mb-2">📧 hello@eventhub.com</p>
              <p className="text-sm mb-2">📞 +1 (555) 123-4567</p>
              <p className="text-sm">📍 123 Event St, NY 10001</p>
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 EventHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
