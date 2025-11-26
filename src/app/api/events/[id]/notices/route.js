import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET - Fetch announcements for an event
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    // Fetch event announcements
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("announcements, userId")
      .eq("id", id)
      .single();

    if (eventError) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Check if user has purchased tickets for this event
    let hasPurchased = false;
    if (userId) {
      const { data: bookings, error: bookingError } = await supabase
        .from("bookings")
        .select("id")
        .eq("eventId", id)
        .eq("userId", userId)
        .eq("status", "CONFIRMED");

      if (!bookingError && bookings && bookings.length > 0) {
        hasPurchased = true;
      }
    }

    // Return announcements with access info
    return NextResponse.json({
      announcements: event.announcements || [],
      hasPurchased,
      canView: hasPurchased,
    });
  } catch (error) {
    console.error("Error fetching event announcements:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}

// POST - Add a new announcement (admin only)
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { message, userId } = await request.json();

    if (!message || !userId) {
      return NextResponse.json(
        { error: "Message and userId are required" },
        { status: 400 }
      );
    }

    // Verify user is admin of this event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("userId, announcements")
      .eq("id", id)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Check if user is the event creator
    const isCreator = event.userId === userId;

    // Check if user is an assigned admin
    const { data: adminData } = await supabase
      .from("event_admins")
      .select("id")
      .eq("eventId", id)
      .eq("userId", userId)
      .single();

    const isAdmin = !!adminData;

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized. Only event admins can post announcements." },
        { status: 403 }
      );
    }

    // Create new announcement object
    const newAnnouncement = {
      id: Date.now().toString(),
      message: message.trim(),
      createdAt: new Date().toISOString(),
      createdBy: userId,
    };

    // Get existing announcements and add the new one
    const existingAnnouncements = event.announcements || [];
    const updatedAnnouncements = [...existingAnnouncements, newAnnouncement];

    // Update event with new announcement
    const { data: updatedEvent, error: updateError } = await supabase
      .from("events")
      .update({ announcements: updatedAnnouncements })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating event announcements:", updateError);
      return NextResponse.json(
        { error: "Failed to add announcement" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      announcement: newAnnouncement,
      announcements: updatedEvent.announcements,
    });
  } catch (error) {
    console.error("Error adding announcement:", error);
    return NextResponse.json(
      { error: "Failed to add announcement" },
      { status: 500 }
    );
  }
}

// DELETE - Remove an announcement (admin only)
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const announcementId = url.searchParams.get("announcementId");
    const userId = url.searchParams.get("userId");

    if (!announcementId || !userId) {
      return NextResponse.json(
        { error: "announcementId and userId are required" },
        { status: 400 }
      );
    }

    // Verify user is admin of this event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("userId, announcements")
      .eq("id", id)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Check if user is the event creator
    const isCreator = event.userId === userId;

    // Check if user is an assigned admin
    const { data: adminData } = await supabase
      .from("event_admins")
      .select("id")
      .eq("eventId", id)
      .eq("userId", userId)
      .single();

    const isAdmin = !!adminData;

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized. Only event admins can delete announcements." },
        { status: 403 }
      );
    }

    // Remove the announcement
    const existingAnnouncements = event.announcements || [];
    const updatedAnnouncements = existingAnnouncements.filter(
      (announcement) => announcement.id !== announcementId
    );

    // Update event
    const { data: updatedEvent, error: updateError } = await supabase
      .from("events")
      .update({ announcements: updatedAnnouncements })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error deleting announcement:", updateError);
      return NextResponse.json(
        { error: "Failed to delete announcement" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      announcements: updatedEvent.announcements,
    });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return NextResponse.json(
      { error: "Failed to delete announcement" },
      { status: 500 }
    );
  }
}
