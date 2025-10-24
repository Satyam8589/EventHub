import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { uploadToCloudinary } from "@/lib/cloudinary";

// GET /api/events - Get all events
export async function GET() {
  try {
    console.log("Starting GET /api/events");
    console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);

    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .order("featured", { ascending: false })
      .order("date", { ascending: true });

    if (error) {
      throw error;
    }

    console.log("Successfully fetched events:", events.length);
    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching events:", error.message);
    console.error("Error code:", error.code);
    console.error("Error details:", error);
    return NextResponse.json(
      { error: "Failed to fetch events", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/events - Create a new event
export async function POST(request) {
  try {
    const contentType = request.headers.get("content-type");
    let body;
    let imageFile = null;

    if (contentType && contentType.includes("multipart/form-data")) {
      // Handle FormData (with file upload)
      const formData = await request.formData();
      body = {
        title: formData.get("title"),
        description: formData.get("description"),
        category: formData.get("category"),
        location: formData.get("location"),
        venue: formData.get("venue"),
        date: formData.get("date"),
        maxAttendees: formData.get("maxAttendees"),
        ticketPrice: formData.get("ticketPrice"),
        organizerId: formData.get("organizerId"),
      };
      imageFile = formData.get("image");
    } else {
      // Handle JSON
      body = await request.json();
    }

    const {
      title,
      description,
      category,
      location,
      venue,
      date,
      maxAttendees,
      ticketPrice,
      organizerId,
      organizerName,
      organizerEmail,
      organizerPhone,
      featured,
      imageUrl: providedImageUrl,
    } = body;

    // Validate required fields
    if (
      !title ||
      !description ||
      !category ||
      !location ||
      !venue ||
      !date ||
      !organizerId ||
      !organizerName ||
      !organizerEmail
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(organizerEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Handle image - use provided URL or upload to Cloudinary
    let imageUrl =
      providedImageUrl ||
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop&crop=center";

    // Only upload if imageFile exists (FormData) and no imageUrl provided
    if (imageFile && imageFile.size > 0 && !providedImageUrl) {
      try {
        // Convert file to buffer
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Cloudinary
        const uploadResult = await uploadToCloudinary(
          buffer,
          "events", // folder
          "image", // resource type
          {
            public_id: `event_${Date.now()}`, // unique public ID
            tags: ["event", "upload"], // tags for organization
          }
        );

        imageUrl = uploadResult.secure_url;
        console.log("Image uploaded to Cloudinary:", uploadResult.public_id);
      } catch (error) {
        console.error("Error uploading image to Cloudinary:", error);
        // Continue with default image if upload fails
      }
    }

    // Extract time from the date
    const eventDate = new Date(date);
    const timeString = eventDate.toTimeString().slice(0, 5); // Format: "HH:MM"

    const { data: event, error: createError } = await supabase
      .from("events")
      .insert([
        {
          title,
          description,
          category,
          location,
          venue,
          date: eventDate.toISOString(),
          time: timeString,
          price: parseFloat(ticketPrice) || 0,
          capacity: parseInt(maxAttendees) || 100,
          imageUrl,
          organizerId,
          organizerName,
          organizerEmail,
          organizerPhone,
          featured: featured || false,
        },
      ])
      .select("*")
      .single();

    if (createError) {
      throw createError;
    }

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
