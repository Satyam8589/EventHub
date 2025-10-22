"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import { useFileUpload } from "@/hooks/useFileUpload";

export default function EditEventPage() {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "CONFERENCE",
    date: "",
    time: "",
    location: "",
    venue: "",
    capacity: "",
    price: "",
    featured: false,
    organizerName: "",
    organizerEmail: "",
    organizerPhone: "",
  });

  // Gallery state
  const [gallery, setGallery] = useState([]);
  const [newMediaFiles, setNewMediaFiles] = useState([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);

  // Discount state
  const [discounts, setDiscounts] = useState([]);
  const [newDiscount, setNewDiscount] = useState({
    code: "",
    type: "PERCENTAGE",
    value: "",
    maxUses: "",
    validUntil: "",
    isActive: true,
  });

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { uploadFile } = useFileUpload();

  // Check admin access and fetch event
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth/login");
      return;
    }

    // Check if user is SUPER_ADMIN
    if (user.role !== "SUPER_ADMIN") {
      router.push("/admin");
      return;
    }

    fetchEvent();
  }, [user, authLoading, params.id]);

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/admin/events/${params.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch event");
      }

      const data = await response.json();
      setEvent(data.event);

      // Populate form data
      const eventDate = new Date(data.event.date);
      setFormData({
        title: data.event.title || "",
        description: data.event.description || "",
        category: data.event.category || "CONFERENCE",
        date: eventDate.toISOString().split("T")[0],
        time: data.event.time || "",
        location: data.event.location || "",
        venue: data.event.venue || "",
        capacity: data.event.capacity || "",
        price: data.event.price || "",
        featured: data.event.featured || false,
        organizerName: data.event.organizerName || "",
        organizerEmail: data.event.organizerEmail || "",
        organizerPhone: data.event.organizerPhone || "",
      });

      // Set gallery and discounts
      setGallery(data.event.gallery || []);
      setDiscounts(data.event.discounts || []);
    } catch (error) {
      console.error("Error fetching event:", error);
      alert("Failed to fetch event details");
      router.push("/admin/events");
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle media file selection
  const handleMediaFileChange = (e) => {
    const files = Array.from(e.target.files);
    setNewMediaFiles(files);
  };

  // Upload new media files
  const uploadMediaFiles = async () => {
    if (newMediaFiles.length === 0) return [];

    setUploadingMedia(true);
    const uploadedFiles = [];

    try {
      for (const file of newMediaFiles) {
        const isVideo = file.type.startsWith("video/");
        const result = await uploadFile(
          file,
          "events/gallery",
          isVideo ? "video" : "image"
        );

        uploadedFiles.push({
          id: Date.now() + Math.random(),
          url: result.url,
          type: isVideo ? "video" : "image",
          name: file.name,
        });
      }

      setGallery((prev) => [...prev, ...uploadedFiles]);
      setNewMediaFiles([]);
    } catch (error) {
      console.error("Error uploading media:", error);
      alert("Failed to upload media files");
    } finally {
      setUploadingMedia(false);
    }
  };

  // Remove media from gallery
  const removeMedia = (mediaId) => {
    setGallery((prev) => prev.filter((item) => item.id !== mediaId));
  };

  // Handle discount creation
  const handleAddDiscount = async () => {
    if (!newDiscount.code || !newDiscount.value) {
      alert("Please fill in discount code and value");
      return;
    }

    try {
      const response = await fetch(`/api/admin/events/${params.id}/discounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newDiscount,
          eventId: params.id,
          value: parseFloat(newDiscount.value),
          maxUses: parseInt(newDiscount.maxUses) || null,
        }),
      });

      if (response.ok) {
        const discount = await response.json();
        setDiscounts((prev) => [...prev, discount]);
        setNewDiscount({
          code: "",
          type: "PERCENTAGE",
          value: "",
          maxUses: "",
          validUntil: "",
          isActive: true,
        });
      } else {
        throw new Error("Failed to create discount");
      }
    } catch (error) {
      console.error("Error creating discount:", error);
      alert("Failed to create discount");
    }
  };

  // Toggle discount status
  const toggleDiscountStatus = async (discountId, isActive) => {
    try {
      const response = await fetch(
        `/api/admin/events/${params.id}/discounts/${discountId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive }),
        }
      );

      if (response.ok) {
        setDiscounts((prev) =>
          prev.map((d) => (d.id === discountId ? { ...d, isActive } : d))
        );
      }
    } catch (error) {
      console.error("Error updating discount:", error);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Upload new media files first
      await uploadMediaFiles();

      // Prepare event data
      const eventDateTime = new Date(
        `${formData.date}T${formData.time}`
      ).toISOString();

      const eventData = {
        ...formData,
        date: eventDateTime,
        capacity: parseInt(formData.capacity),
        price: parseFloat(formData.price),
        gallery: gallery,
      };

      const response = await fetch(`/api/admin/events/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        alert("Event updated successfully!");
        router.push("/admin/events");
      } else {
        throw new Error("Failed to update event");
      }
    } catch (error) {
      console.error("Error updating event:", error);
      alert("Failed to update event");
    } finally {
      setSaving(false);
    }
  };

  // Media popup component
  const MediaPopup = ({ media, onClose }) => (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white text-2xl hover:text-red-400"
        >
          ✕
        </button>
        {media.type === "video" ? (
          <video
            src={media.url}
            controls
            autoPlay
            className="max-w-full max-h-[80vh] rounded-lg"
          />
        ) : (
          <img
            src={media.url}
            alt={media.name}
            className="max-w-full max-h-[80vh] rounded-lg object-contain"
          />
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!event) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-white mb-4">
            Event Not Found
          </h2>
          <button
            onClick={() => router.push("/admin/events")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Back to Events
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-900 p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white">Edit Event</h1>
            <button
              onClick={() => router.push("/admin/events")}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              ← Back to Events
            </button>
          </div>
          <p className="text-blue-200">
            Update event details, manage gallery, and create discounts
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Event Information */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              📝 Event Information
            </h2>

            <div className="space-y-6">
              {/* Title */}
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

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-white font-medium">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                  placeholder="Describe your event in detail"
                />
              </div>

              {/* Category and Featured */}
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

                <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-xl border border-white/20">
                  <input
                    type="checkbox"
                    id="featured"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleInputChange}
                    className="w-5 h-5 rounded border-2 border-white/20 bg-white/5 text-blue-600 focus:ring-blue-500 focus:ring-2"
                  />
                  <label
                    htmlFor="featured"
                    className="text-white font-medium cursor-pointer"
                  >
                    ⭐ Featured Event
                  </label>
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

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
                  <label className="block text-white font-medium">
                    Venue *
                  </label>
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

              {/* Capacity and Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-white font-medium">
                    Max Capacity *
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., 100"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-white font-medium">
                    Ticket Price (₹) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., 999.00"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Gallery Section */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              🖼️ Event Gallery
            </h2>

            {/* Upload New Media */}
            <div className="mb-6">
              <label className="block text-white font-medium mb-2">
                Add Images & Videos
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleMediaFileChange}
                  className="flex-1 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
                {newMediaFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={uploadMediaFiles}
                    disabled={uploadingMedia}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {uploadingMedia
                      ? "Uploading..."
                      : `Upload ${newMediaFiles.length} files`}
                  </button>
                )}
              </div>
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {gallery.map((media) => (
                <div key={media.id} className="relative group">
                  <div
                    className="aspect-square bg-white/5 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => setSelectedMedia(media)}
                  >
                    {media.type === "video" ? (
                      <video
                        src={media.url}
                        className="w-full h-full object-cover"
                        muted
                      />
                    ) : (
                      <img
                        src={media.url}
                        alt={media.name}
                        className="w-full h-full object-cover"
                      />
                    )}

                    {/* Play icon for videos */}
                    {media.type === "video" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center">
                          <span className="text-black text-xl">▶</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removeMedia(media.id)}
                    className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {gallery.length === 0 && (
              <div className="text-center py-12 text-white/60">
                <div className="text-4xl mb-4">📸</div>
                <p>No media files yet. Upload some images or videos!</p>
              </div>
            )}
          </div>

          {/* Discounts Section */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              🎟️ Event Discounts
            </h2>

            {/* Add New Discount */}
            <div className="bg-white/5 rounded-xl p-4 mb-6">
              <h3 className="text-white font-medium mb-4">
                Create New Discount
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Discount Code"
                  value={newDiscount.code}
                  onChange={(e) =>
                    setNewDiscount({
                      ...newDiscount,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  className="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-blue-500"
                />

                <select
                  value={newDiscount.type}
                  onChange={(e) =>
                    setNewDiscount({ ...newDiscount, type: e.target.value })
                  }
                  className="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (₹)</option>
                </select>

                <input
                  type="number"
                  placeholder={
                    newDiscount.type === "PERCENTAGE"
                      ? "Discount %"
                      : "Amount ₹"
                  }
                  value={newDiscount.value}
                  onChange={(e) =>
                    setNewDiscount({ ...newDiscount, value: e.target.value })
                  }
                  className="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-blue-500"
                />

                <input
                  type="number"
                  placeholder="Max Uses (optional)"
                  value={newDiscount.maxUses}
                  onChange={(e) =>
                    setNewDiscount({ ...newDiscount, maxUses: e.target.value })
                  }
                  className="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-blue-500"
                />

                <input
                  type="datetime-local"
                  value={newDiscount.validUntil}
                  onChange={(e) =>
                    setNewDiscount({
                      ...newDiscount,
                      validUntil: e.target.value,
                    })
                  }
                  className="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />

                <button
                  type="button"
                  onClick={handleAddDiscount}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Add Discount
                </button>
              </div>
            </div>

            {/* Existing Discounts */}
            <div className="space-y-3">
              {discounts.map((discount) => (
                <div
                  key={discount.id}
                  className="bg-white/5 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-lg font-mono text-sm">
                        {discount.code}
                      </span>
                      <span className="text-white">
                        {discount.type === "PERCENTAGE"
                          ? `${discount.value}%`
                          : `₹${discount.value}`}{" "}
                        off
                      </span>
                      {discount.maxUses && (
                        <span className="text-white/60 text-sm">
                          Max: {discount.maxUses} uses
                        </span>
                      )}
                      {discount.validUntil && (
                        <span className="text-white/60 text-sm">
                          Until:{" "}
                          {new Date(discount.validUntil).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        discount.isActive
                          ? "bg-green-600 text-white"
                          : "bg-red-600 text-white"
                      }`}
                    >
                      {discount.isActive ? "Active" : "Inactive"}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        toggleDiscountStatus(discount.id, !discount.isActive)
                      }
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        discount.isActive
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : "bg-green-600 hover:bg-green-700 text-white"
                      }`}
                    >
                      {discount.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              ))}

              {discounts.length === 0 && (
                <div className="text-center py-8 text-white/60">
                  <div className="text-3xl mb-2">🎫</div>
                  <p>No discounts created yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Organizer Information */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              👤 Organizer Information
            </h2>

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
                  placeholder="Organization or person name"
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
                  placeholder="contact@organization.com"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-white font-medium">
                  Organizer Phone
                </label>
                <input
                  type="tel"
                  name="organizerPhone"
                  value={formData.organizerPhone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="+91 98765 43210 (optional)"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push("/admin/events")}
              className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-8 py-3 rounded-xl transition-colors flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                "Update Event"
              )}
            </button>
          </div>
        </form>

        {/* Media Popup */}
        {selectedMedia && (
          <MediaPopup
            media={selectedMedia}
            onClose={() => setSelectedMedia(null)}
          />
        )}
      </div>
    </AdminLayout>
  );
}
