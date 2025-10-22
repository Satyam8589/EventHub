"use client";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      const result = await signOut();

      // Only reload if sign out was successful
      if (!result.error) {
        // Force page reload to ensure UI updates
        window.location.reload();
      } else {
        setIsOpen(false);
      }
    } catch (error) {
      console.error("Error signing out:", error);
      setIsOpen(false);
    }
  };

  if (!user) return null;

  const displayName = user.displayName || user.email?.split("@")[0] || "User";
  const avatarUrl = user.photoURL;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-8 h-8 rounded-full border-2 border-white/20"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
            {displayName[0].toUpperCase()}
          </div>
        )}
        <span className="hidden md:block font-medium">{displayName}</span>
        <svg
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 shadow-xl z-50">
          <div className="py-2">
            <div className="px-4 py-2 border-b border-white/20">
              <p className="text-sm font-medium text-white">{displayName}</p>
              <p className="text-xs text-white/60 truncate">{user.email}</p>
              <p className="text-xs text-yellow-400">
                Role: {user.role || "Not Set"}
              </p>
            </div>

            <a
              href="/my-events"
              className="block px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              My Events
            </a>

            {/* Admin Panel Link - Only show for admins */}
            {(user.role === "SUPER_ADMIN" || user.role === "EVENT_ADMIN") && (
              <a
                href="/admin"
                className="block px-4 py-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-white/10 transition-colors border-t border-white/20"
              >
                🛡️ Admin Panel
              </a>
            )}

            <div className="border-t border-white/20 mt-2 pt-2">
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/10 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
