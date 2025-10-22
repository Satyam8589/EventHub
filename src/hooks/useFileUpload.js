import { useState } from "react";

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (
    file,
    folder = "uploads",
    resourceType = "image"
  ) => {
    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      formData.append("resourceType", resourceType);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const result = await response.json();
      setProgress(100);
      return result;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000); // Reset progress after 1 second
    }
  };

  const deleteFile = async (publicId, resourceType = "image") => {
    try {
      const response = await fetch(
        `/api/upload?publicId=${publicId}&resourceType=${resourceType}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Delete failed");
      }

      return await response.json();
    } catch (error) {
      console.error("Delete error:", error);
      throw error;
    }
  };

  return {
    uploadFile,
    deleteFile,
    uploading,
    progress,
  };
}
