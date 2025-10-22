import { NextResponse } from "next/server";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";

// POST /api/upload - Upload file to Cloudinary
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = formData.get("folder") || "uploads";
    const resourceType = formData.get("resourceType") || "image";

    if (!file || !file.size) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const allowedVideoTypes = [
      "video/mp4",
      "video/avi",
      "video/mov",
      "video/wmv",
      "video/flv",
    ];

    if (resourceType === "image" && !allowedImageTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid image format. Supported formats: JPEG, PNG, GIF, WebP",
        },
        { status: 400 }
      );
    }

    if (resourceType === "video" && !allowedVideoTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid video format. Supported formats: MP4, AVI, MOV, WMV, FLV",
        },
        { status: 400 }
      );
    }

    // Validate file size (10MB for images, 100MB for videos)
    const maxSize =
      resourceType === "image" ? 10 * 1024 * 1024 : 100 * 1024 * 1024;
    if (file.size > maxSize) {
      const maxSizeMB = resourceType === "image" ? "10MB" : "100MB";
      return NextResponse.json(
        { error: `File size too large. Maximum size: ${maxSizeMB}` },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(
      buffer,
      folder,
      resourceType,
      {
        public_id: `${resourceType}_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        tags: [folder, resourceType, "eventhub"],
      }
    );

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      width: uploadResult.width,
      height: uploadResult.height,
      format: uploadResult.format,
      resourceType: uploadResult.resource_type,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

// DELETE /api/upload - Delete file from Cloudinary
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get("publicId");
    const resourceType = searchParams.get("resourceType") || "image";

    if (!publicId) {
      return NextResponse.json(
        { error: "Public ID is required" },
        { status: 400 }
      );
    }

    const result = await deleteFromCloudinary(publicId, resourceType);

    return NextResponse.json({
      success: true,
      result: result.result,
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
