import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendPushNotificationToMultiple } from "@/lib/pushNotification";

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
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
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
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
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

    // Send push notifications to all users who purchased tickets for this event
    try {
      // Get all users who purchased tickets
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("userId")
        .eq("eventId", id)
        .eq("status", "CONFIRMED");

      if (!bookingsError && bookings && bookings.length > 0) {
        // Get unique user IDs
        const userIds = [...new Set(bookings.map((b) => b.userId))];

        // Get push subscriptions for these users
        const { data: subscriptions, error: subsError } = await supabase
          .from("push_subscriptions")
          .select("*")
          .in("user_id", userIds);

        if (!subsError && subscriptions && subscriptions.length > 0) {
          // Convert to push subscription format
          const pushSubscriptions = subscriptions.map((sub) => ({
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          }));

          // Get event details for notification
          const { data: eventDetails } = await supabase
            .from("events")
            .select("name")
            .eq("id", id)
            .single();

          // Send push notifications
          await sendPushNotificationToMultiple(pushSubscriptions, {
            title: `📢 ${eventDetails?.name || "Event"} Announcement`,
            message: message.trim(),
            icon: "/icon-192.png",
            data: {
              url: `/events/${id}`,
              eventId: id,
              type: "announcement",
            },
            tag: `announcement-${id}-${newAnnouncement.id}`,
          });

          console.log(
            `✅ Sent push notifications to ${subscriptions.length} subscribers`
          );
        }
      }
    } catch (notifError) {
      // Don't fail the request if push notifications fail
      console.error("Error sending push notifications:", notifError);
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
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
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
