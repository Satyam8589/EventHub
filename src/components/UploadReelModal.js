"use client";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function UploadReelModal({ onClose, onSuccess }) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tags: [],
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);

  // Available hashtags
  const availableTags = [
    "eventhub",
    "music",
    "technology",
    "food",
    "art",
    "sports",
    "gaming",
    "travel",
    "fitness",
    "fashion",
    "education",
    "entertainment",
  ];

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/webm",
    ];
    if (!validTypes.includes(file.type)) {
      setError(
        "Please select a valid image (JPEG, PNG, GIF, WebP) or video (MP4, WebM)"
      );
      return;
    }

    // Validate file size (max 10MB for images, 50MB for videos)
    const maxSize = file.type.startsWith("video")
      ? 50 * 1024 * 1024
      : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(
        `File size must be less than ${
          file.type.startsWith("video") ? "50MB" : "10MB"
        }`
      );
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const toggleTag = (tag) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate user - Firebase uses uid, not id
    const userId = user?.uid || user?.id;
    if (!user || !userId) {
      setError("You must be logged in to upload reels");
      console.error("User object:", user);
      return;
    }

    if (!selectedFile) {
      setError("Please select an image or video");
      return;
    }

    if (!formData.title.trim()) {
      setError("Please enter a title");
      return;
    }

    if (formData.tags.length === 0) {
      setError("Please select at least one hashtag");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Upload directly to Cloudinary (bypasses server size limits)
      const uploadFormData = new FormData();
      uploadFormData.append("file", selectedFile);
      uploadFormData.append("upload_preset", "eventhub_reels");

      console.log("Uploading file directly to Cloudinary...");
      const resourceType = selectedFile.type.startsWith("video")
        ? "video"
        : "image";
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/dz05ozsng/${resourceType}/upload`;

      const uploadResponse = await fetch(cloudinaryUrl, {
        method: "POST",
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        let errorMessage = "Failed to upload file";
        try {
          const responseClone = uploadResponse.clone();
          const errorData = await responseClone.json();
          console.error("Upload error:", errorData);
          errorMessage = errorData.error?.message || errorMessage;
        } catch (parseError) {
          try {
            const responseText = await uploadResponse.text();
            console.error("Upload error (non-JSON):", responseText);
            if (uploadResponse.status === 413) {
              errorMessage = "File is too large. Please try a smaller file.";
            } else if (
              responseText.includes("Forbidden") ||
              uploadResponse.status === 403
            ) {
              errorMessage =
                "Upload forbidden. File may be too large or server limit reached.";
            } else {
              errorMessage =
                responseText ||
                `Upload failed with status ${uploadResponse.status}`;
            }
          } catch (textError) {
            errorMessage = `Upload failed with status ${uploadResponse.status}`;
          }
        }
        throw new Error(errorMessage);
      }

      const uploadData = await uploadResponse.json();
      const mediaUrl = uploadData.secure_url;
      console.log("File uploaded successfully:", mediaUrl);

      // Prepare reel data
      const reelData = {
        userId: userId, // Use the extracted userId (uid or id)
        title: formData.title.trim(),
        description: formData.description.trim(),
        mediaUrl: mediaUrl,
        mediaType: selectedFile.type.startsWith("video") ? "video" : "image",
        tags: formData.tags,
      };

      console.log("Creating reel with data:", reelData);

      // Create reel in database
      const reelResponse = await fetch("/api/reels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reelData),
      });

      if (!reelResponse.ok) {
        let errorMessage = "Failed to create reel";
        try {
          const errorData = await reelResponse.json();
          console.error("Reel creation error:", errorData);
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error("Could not parse reel creation error response");
          errorMessage = `Failed to create reel (Status: ${reelResponse.status})`;
        }
        throw new Error(errorMessage);
      }

      const responseData = await reelResponse.json();
      console.log("Reel created successfully:", responseData);

      // Success!
      onSuccess(responseData.reel);
      onClose();
    } catch (err) {
      console.error("Error uploading reel:", err);
      setError(err.message || "Failed to upload reel. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-pink-500 to-purple-500 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Upload Reel</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-white font-medium mb-3">
              Image or Video *
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="block w-full p-8 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-pink-500 transition-colors bg-white/5"
              >
                {previewUrl ? (
                  <div className="relative">
                    {selectedFile?.type.startsWith("video") ? (
                      <video
                        src={previewUrl}
                        className="max-h-64 mx-auto rounded-lg"
                        controls
                      />
                    ) : (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-h-64 mx-auto rounded-lg"
                      />
                    )}
                    <p className="text-center text-gray-400 mt-3 text-sm">
                      Click to change
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-6xl mb-3">📸</div>
                    <p className="text-white font-medium mb-1">
                      Click to upload image or video
                    </p>
                    <p className="text-gray-400 text-sm">
                      Images: max 10MB | Videos: max 50MB
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-white font-medium mb-3">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Give your reel a catchy title..."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              maxLength={100}
            />
            <p className="text-gray-400 text-xs mt-1">
              {formData.title.length}/100 characters
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-white font-medium mb-3">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Tell us more about your reel..."
              rows={3}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all resize-none"
              maxLength={500}
            />
            <p className="text-gray-400 text-xs mt-1">
              {formData.description.length}/500 characters
            </p>
          </div>

          {/* Hashtags */}
          <div>
            <label className="block text-white font-medium mb-3">
              Hashtags * (Select at least one)
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    formData.tags.includes(tag)
                      ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg scale-105"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
            {formData.tags.length > 0 && (
              <p className="text-gray-400 text-sm mt-2">
                Selected: {formData.tags.map((t) => `#${t}`).join(", ")}
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors font-medium"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:scale-105 transition-transform font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Uploading...
                </span>
              ) : (
                "Upload Reel"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
