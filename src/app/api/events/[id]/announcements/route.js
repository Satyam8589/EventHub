import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendNotificationToUsers } from "@/lib/notificationHelper";

// GET - Fetch announcements for an event
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    // Fetch event announcements - select all to handle any column naming
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (eventError) {
      console.error("Error fetching event:", eventError);
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
        .eq("eventId", id)  // bookings table uses camelCase
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
      .select("*")
      .eq("id", id)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Check if user is the event creator (handle both userId and user_id)
    const eventUserId = event.userId || event.user_id;
    const isCreator = eventUserId === userId;

    // Check if user is a super admin
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    const isSuperAdmin = userData?.role === "SUPER_ADMIN";

    // Check if user is an assigned admin
    const { data: adminData } = await supabase
      .from("event_admins")
      .select("id")
      .eq("event_id", id)
      .eq("user_id", userId)
      .single();

    const isAdmin = !!adminData;

    if (!isCreator && !isAdmin && !isSuperAdmin) {
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

    // Get existing announcements and add the new one at the beginning (latest first)
    const existingAnnouncements = event.announcements || [];
    const updatedAnnouncements = [newAnnouncement, ...existingAnnouncements];

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

    // Send push notifications to all ticket holders
    try {
      // Get all confirmed bookings for this event
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("userId")
        .eq("eventId", id)
        .eq("status", "CONFIRMED");

      if (!bookingsError && bookings && bookings.length > 0) {
        // Get unique user IDs
        const userIds = [...new Set(bookings.map(b => b.userId))];
        
        // Send push notification to all ticket holders
        await sendNotificationToUsers(userIds, "event-announcement", {
          eventId: id,
          eventTitle: event.title || "Event",
          announcementPreview: message.trim().substring(0, 100),
        });

        console.log(`Sent announcement notification to ${userIds.length} ticket holders`);
      }
    } catch (notifError) {
      // Don't fail the request if notification fails
      console.error("Error sending announcement notifications:", notifError);
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
      .select("*")
      .eq("id", id)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Check if user is the event creator (handle both userId and user_id)
    const eventUserId = event.userId || event.user_id;
    const isCreator = eventUserId === userId;

    // Check if user is a super admin
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    const isSuperAdmin = userData?.role === "SUPER_ADMIN";

    // Check if user is an assigned admin
    const { data: adminData } = await supabase
      .from("event_admins")
      .select("id")
      .eq("event_id", id)
      .eq("user_id", userId)
      .single();

    const isAdmin = !!adminData;

    if (!isCreator && !isAdmin && !isSuperAdmin) {
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
