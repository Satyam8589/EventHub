'use client';
import { useState, useEffect } from 'react';
import EventCard from '../../components/EventCard';

export default function EventsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedDate, setSelectedDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Extended events data
  const allEvents = [
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
      imageUrl: null,
    },
    {
      id: 2,
      title: "Tech Innovation Summit",
      description: "Where technology meets innovation",
      date: "August 20, 2025 at 09:00",
      location: "Convention Center, San Francisco",
      price: 499,
      category: "Technology",
      registered: 756,
      capacity: 1000,
      featured: true,
      imageUrl: null,
    },
    {
      id: 3,
      title: "International Food & Wine Festival",
      description: "A multicultural journey around the world",
      date: "September 10, 2025 at 17:00",
      location: "Harbor Square, Seattle",
      price: 149,
      category: "Food & Drink",
      registered: 789,
      capacity: 1200,
      featured: true,
      imageUrl: null,
    },
    {
      id: 4,
      title: "Art & Design Expo",
      description: "Where creativity meets innovation",
      date: "October 5, 2025 at 10:00",
      location: "Museum District, Boston",
      price: 75,
      category: "Art & Culture",
      registered: 445,
      capacity: 800,
      featured: false,
      imageUrl: null,
    },
    {
      id: 5,
      title: "Marathon for Charity",
      description: "Run for a better tomorrow",
      date: "November 12, 2025 at 07:00",
      location: "Downtown, Chicago",
      price: 45,
      category: "Sports",
      registered: 2567,
      capacity: 3000,
      featured: false,
      imageUrl: null,
    },
    {
      id: 6,
      title: "Business Leadership Workshop",
      description: "Develop your leadership potential",
      date: "December 8, 2025 at 09:00",
      location: "Business Center, Austin",
      price: 350,
      category: "Business",
      registered: 180,
      capacity: 250,
      featured: false,
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
    }
  ];

  const categories = [
    'All Categories', 'Music', 'Technology', 'Food & Drink', 'Art & Culture', 
    'Sports', 'Business', 'Gaming', 'Education', 'Entertainment', 'Health & Wellness'
  ];

  // Filter events based on search and category
  const filteredEvents = allEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All Categories' || event.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

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
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`
          }}
        />
        <div 
          className="absolute w-96 h-96 bg-linear-to-r from-yellow-400 to-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000 top-20 right-20"
          style={{
            transform: `translate(${mousePosition.x * -0.01}px, ${mousePosition.y * -0.01}px)`
          }}
        />
        <div 
          className="absolute w-96 h-96 bg-linear-to-r from-green-400 to-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000 bottom-20 left-20"
          style={{
            transform: `translate(${mousePosition.x * 0.015}px, ${mousePosition.y * 0.015}px)`
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-linear-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="text-white font-bold text-xl">EventHub</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8 text-white/80">
              <a href="/" className="hover:text-white transition-colors">Home</a>
              <a href="/events" className="text-white font-medium">Events</a>
              <a href="#" className="hover:text-white transition-colors">My Events</a>
              <a href="#" className="hover:text-white transition-colors">About</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>

            <button className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg transition-colors">
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* Header Section */}
      <div className="relative z-10 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Discover Events</h1>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Explore our calendar of amazing events
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-300">🔍</span>
                </div>
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 border border-white/20 rounded-lg bg-white/10 backdrop-blur-md text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-white/20 rounded-lg bg-white/10 backdrop-blur-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                {categories.map(category => (
                  <option key={category} value={category} className="text-gray-900 bg-white">{category}</option>
                ))}
              </select>

              {/* Date Filter */}
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-3 border border-white/20 rounded-lg bg-white/10 backdrop-blur-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />

              {/* More Filters Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-3 border border-white/20 rounded-lg bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-colors"
              >
                <span>⚙️</span>
                <span>More Filters</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Results Count */}
        <div className="flex justify-between items-center mb-8">
          <p className="text-gray-300">
            <span className="font-medium text-white">{filteredEvents.length} Events Found</span>
          </p>
          <button className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
            <span>⚙️</span>
            <span>More Filters</span>
          </button>
        </div>

        {/* Events Grid */}
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event, index) => (
              <div
                key={event.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <EventCard event={event} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">No events found</h3>
            <p className="text-gray-300 mb-4">
              Try adjusting your search criteria or browse all categories
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All Categories');
                setSelectedDate('');
              }}
              className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Load More Button */}
        {filteredEvents.length > 0 && (
          <div className="text-center mt-12">
            <button className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-3 rounded-lg hover:bg-white/20 transition-colors font-medium">
              Load More Events
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-linear-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">E</span>
                </div>
                <span className="text-white font-bold text-xl">EventHub</span>
              </div>
              <p className="text-gray-400 text-sm">
                Your premium destination for discovering and booking amazing events
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Browse Events</a></li>
                <li><a href="#" className="hover:text-white transition-colors">My Events</a></li>
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Categories</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Music</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Technology</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Food & Drink</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Sports</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Contact Us</h4>
              <p className="text-gray-400 text-sm mb-2">📧 info@eventhub.com</p>
              <p className="text-gray-400 text-sm mb-2">📞 +1 (555) 123-4567</p>
              <p className="text-gray-400 text-sm">📍 123 Event St, NY 10001</p>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 EventHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}