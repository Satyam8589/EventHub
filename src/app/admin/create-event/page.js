"use client";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import { useFileUpload } from "@/hooks/useFileUpload";

export default function CreateEvent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const { uploadFile, uploading, progress } = useFileUpload();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "CONFERENCE",
    date: "",
    time: "",
    location: "",
    venue: "",
    maxAttendees: "",
    ticketPrice: "",
    organizerName: "",
    organizerEmail: "",
    organizerPhone: "",
    featured: false,
    image: null,
  });

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, files, type, checked } = e.target;

    if (name === "image" && files && files[0]) {
      const file = files[0];
      setFormData((prev) => ({ ...prev, image: file }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    } else if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle image upload to Cloudinary
  const handleImageUpload = async (file) => {
    try {
      const result = await uploadFile(file, "events", "image");
      setUploadedImageUrl(result.url);
      return result.url;
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
      return null;
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      let finalImageUrl = uploadedImageUrl;

      // Upload image to Cloudinary if not already uploaded
      if (formData.image && !uploadedImageUrl) {
        finalImageUrl = await handleImageUpload(formData.image);
        if (!finalImageUrl) {
          setLoading(false);
          return; // Stop if image upload failed
        }
      }

      // Combine date and time
      const eventDateTime = new Date(
        `${formData.date}T${formData.time}`
      ).toISOString();

      // Prepare data for API
      const eventData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        date: eventDateTime,
        location: formData.location,
        venue: formData.venue,
        maxAttendees: parseInt(formData.maxAttendees),
        ticketPrice: parseFloat(formData.ticketPrice),
        organizerId: user.uid,
        organizerName: formData.organizerName,
        organizerEmail: formData.organizerEmail,
        organizerPhone: formData.organizerPhone || null,
        featured: formData.featured,
        imageUrl: finalImageUrl,
      };

      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        const newEvent = await response.json();
        router.push("/admin/events");
      } else {
        const error = await response.json();
        alert(error.message || "Failed to create event");
      }
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to create event. Please try again.");
    }
    setLoading(false);
  };

  // Check if user is super admin
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== "SUPER_ADMIN") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">
          Access Denied - Super Admin Only
        </div>
      </div>
    );
  }

  return (
    <AdminLayout activeTab="events">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-md rounded-2xl border border-blue-500/30 p-6">
          <h1 className="text-2xl font-bold text-white mb-2">
            Create New Event
          </h1>
          <p className="text-blue-200">
            Fill in the details below to create a new event for your platform.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Image Upload */}
            <div className="space-y-4">
              <label className="block text-white font-medium">
                Event Image
              </label>
              <div className="flex items-center space-x-6">
                <div className="shrink-0 relative">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        className="h-32 w-32 object-cover rounded-xl border-2 border-white/20"
                        src={imagePreview}
                        alt="Event preview"
                      />
                      {uploadedImageUrl && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-32 w-32 rounded-xl border-2 border-dashed border-white/30 flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-3xl">🖼️</span>
                        <p className="text-white/60 text-xs mt-1">No image</p>
                      </div>
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                      <div className="text-white text-xs">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-1"></div>
                        {progress > 0 && <div>{progress}%</div>}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="cursor-pointer">
                    <span className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors inline-block">
                      {uploading ? "Uploading..." : "Choose Image"}
                    </span>
                    <input
                      type="file"
                      name="image"
                      accept="image/*"
                      onChange={handleInputChange}
                      disabled={uploading}
                      className="sr-only"
                    />
                  </label>
                  {uploadedImageUrl && (
                    <p className="text-green-400 text-xs">
                      ✓ Image uploaded to Cloudinary
                    </p>
                  )}
                  {formData.image && !uploadedImageUrl && (
                    <p className="text-yellow-400 text-xs">
                      Image ready for upload
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Event Title */}
            <div className="space-y-2">
              <label className="block text-white font-medium">
                Event Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Enter event title"
              />
            </div>

            {/* Event Description */}
            <div className="space-y-2">
              <label className="block text-white font-medium">
                Event Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                placeholder="Describe your event in detail"
              />
            </div>

            {/* Category and Date Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-white font-medium">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="CONFERENCE">Conference</option>
                  <option value="WORKSHOP">Workshop</option>
                  <option value="SEMINAR">Seminar</option>
                  <option value="NETWORKING">Networking</option>
                  <option value="ENTERTAINMENT">Entertainment</option>
                  <option value="SPORTS">Sports</option>
                  <option value="CULTURAL">Cultural</option>
                  <option value="EDUCATIONAL">Educational</option>
                  <option value="CHARITY">Charity</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-white font-medium">
                  Event Date *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Time and Max Attendees Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-white font-medium">
                  Event Time *
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-white font-medium">
                  Max Attendees *
                </label>
                <input
                  type="number"
                  name="maxAttendees"
                  value={formData.maxAttendees}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g., 100"
                />
              </div>
            </div>

            {/* Location and Venue */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-white font-medium">
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g., New York, NY"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-white font-medium">Venue *</label>
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g., Convention Center Hall A"
                />
              </div>
            </div>

            {/* Ticket Price */}
            <div className="space-y-2">
              <label className="block text-white font-medium">
                Ticket Price (₹) *
              </label>
              <input
                type="number"
                name="ticketPrice"
                value={formData.ticketPrice}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., 999.00"
              />
            </div>

            {/* Featured Event */}
            <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-xl border border-white/20">
              <input
                type="checkbox"
                id="featured"
                name="featured"
                checked={formData.featured}
                onChange={handleInputChange}
                className="w-5 h-5 rounded border-2 border-white/20 bg-white/5 text-blue-600 focus:ring-blue-500 focus:ring-2"
              />
              <div className="flex-1">
                <label
                  htmlFor="featured"
                  className="block text-white font-medium cursor-pointer"
                >
                  ⭐ Feature this Event
                </label>
                <p className="text-white/60 text-sm">
                  Featured events will appear at the top of event listings and
                  get more visibility
                </p>
              </div>
            </div>

            {/* Organizer Information */}
            <div className="space-y-4 pt-4 border-t border-white/20">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span>👤</span>
                Organizer Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-white font-medium">
                    Organizer Name *
                  </label>
                  <input
                    type="text"
                    name="organizerName"
                    value={formData.organizerName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., John Smith"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-white font-medium">
                    Organizer Email *
                  </label>
                  <input
                    type="email"
                    name="organizerEmail"
                    value={formData.organizerEmail}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., john@company.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-white font-medium">
                  Organizer Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  name="organizerPhone"
                  value={formData.organizerPhone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g., +1 (555) 123-4567"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <span>🎯</span>
                    <span>Create Event</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push("/admin/events")}
                className="flex-1 sm:flex-none bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-xl transition-colors border border-white/20"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
