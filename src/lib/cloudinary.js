import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "dz05ozsng";
const apiKey = process.env.CLOUDINARY_API_KEY || "953385686121885";
const apiSecret =
  process.env.CLOUDINARY_API_SECRET || "6aGFnHqg_502ZFRf6CmYxKG-Z6A";

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

// Validate configuration
if (!cloudName || !apiKey || !apiSecret) {
  console.error(
    "Cloudinary configuration is incomplete. Please check your environment variables."
  );
}

/**
 * Upload an image or video to Cloudinary
 * @param {Buffer} buffer - File buffer
 * @param {string} folder - Cloudinary folder to store the file
 * @param {string} resourceType - 'image' or 'video'
 * @param {Object} options - Additional Cloudinary options
 * @returns {Promise<Object>} - Upload result
 */
export async function uploadToCloudinary(
  buffer,
  folder = "events",
  resourceType = "image",
  options = {}
) {
  try {
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        folder,
        resource_type: resourceType,
        transformation:
          resourceType === "image"
            ? [{ width: 1200, height: 800, crop: "fill", quality: "auto" }]
            : undefined,
        ...options,
      };

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            console.error("Upload options:", uploadOptions);
            console.error("Cloudinary config:", {
              cloud_name: cloudinary.config().cloud_name,
              api_key: cloudinary.config().api_key,
              api_secret: cloudinary.config().api_secret
                ? "***SET***"
                : "***NOT SET***",
            });
            reject(new Error(`Cloudinary upload failed: ${error.message}`));
          } else {
            console.log("Cloudinary upload successful:", result.public_id);
            resolve(result);
          }
        }
      );

      uploadStream.end(buffer);
    });
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw new Error(`Upload process failed: ${error.message}`);
  }
}

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - Public ID of the file to delete
 * @param {string} resourceType - 'image' or 'video'
 * @returns {Promise<Object>} - Deletion result
 */
export async function deleteFromCloudinary(publicId, resourceType = "image") {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    throw error;
  }
}

/**
 * Get optimized image URL from Cloudinary
 * @param {string} publicId - Public ID of the image
 * @param {Object} transformations - Cloudinary transformations
 * @returns {string} - Optimized image URL
 */
export function getOptimizedImageUrl(publicId, transformations = {}) {
  const defaultTransformations = {
    fetch_format: "auto",
    quality: "auto",
    ...transformations,
  };

  return cloudinary.url(publicId, defaultTransformations);
}

/**
 * Generate image variants for different use cases
 * @param {string} publicId - Public ID of the image
 * @returns {Object} - Object containing different image sizes
 */
export function generateImageVariants(publicId) {
  return {
    thumbnail: getOptimizedImageUrl(publicId, {
      width: 300,
      height: 200,
      crop: "fill",
    }),
    medium: getOptimizedImageUrl(publicId, {
      width: 600,
      height: 400,
      crop: "fill",
    }),
    large: getOptimizedImageUrl(publicId, {
      width: 1200,
      height: 800,
      crop: "fill",
    }),
    original: getOptimizedImageUrl(publicId),
  };
}

export default cloudinary;
