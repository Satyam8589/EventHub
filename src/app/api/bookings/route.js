import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendTicketEmail, generateBookingEmailHTML } from "@/lib/email";
import { generateTicketImage } from "@/lib/generateTicketImage";

// GET /api/bookings - Get all bookings (with optional user filter)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status"); // Optional status filter

    console.log("=== FETCHING BOOKINGS ===");
    console.log("User ID filter:", userId);
    console.log("Status filter:", status);

    // First get the bookings
    let query = supabase
      .from("bookings")
      .select("*")
      .order("createdAt", { ascending: false });

    if (userId) {
      query = query.eq("userId", userId);
    }

    // Filter by status if provided (e.g., "CONFIRMED", "PENDING", "FAILED")
    if (status) {
      query = query.eq("status", status);
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error("Error fetching bookings:", error);
      throw error;
    }

    console.log(`Found ${bookings?.length || 0} bookings`);
    console.log(
      "Booking statuses:",
      bookings?.map((b) => ({ id: b.id, status: b.status, userId: b.userId, eventId: b.eventId }))
    );

    if (!bookings || bookings.length === 0) {
      console.log("⚠️ NO BOOKINGS FOUND FOR THIS QUERY");
      console.log("Check: 1) userId exists in database, 2) bookings exist for this user, 3) status matches filter");
    }

    // Then fetch event and user details for each booking
    const bookingsWithEventAndUser = await Promise.all(
      bookings.map(async (booking) => {
        // Fetch event details
        const { data: event, error: eventError } = await supabase
          .from("events")
          .select("*")
          .eq("id", booking.eventId)
          .single();

        // Fetch user details
        const { data: user, error: userError } = await supabase
          .from("users")
          .select("id, name, email, phone, avatar")
          .eq("id", booking.userId)
          .single();

        if (eventError) {
          console.warn(
            `Could not fetch event for booking ${booking.id}:`,
            eventError
          );
        }

        if (userError) {
          console.warn(
            `Could not fetch user for booking ${booking.id}:`,
            userError
          );
        }

        return {
          ...booking,
          event: event || null,
          user: user || null,
        };
      })
    );

    console.log(
      `Returning ${bookingsWithEventAndUser.length} bookings with event data`
    );

    return NextResponse.json(
      { bookings: bookingsWithEventAndUser },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

// POST /api/bookings - Create a new booking
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      userId,
      eventId,
      tickets,
      totalAmount,
      paymentMethod,
      userDetails,
    } = body;

    // Validate required fields
    if (!userId || !eventId || !tickets || !totalAmount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if event exists and has capacity
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Calculate current bookings
    const { data: existingBookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("tickets")
      .eq("eventId", eventId)
      .in("status", ["CONFIRMED", "PENDING"]);

    if (bookingsError) {
      throw bookingsError;
    }

    const totalBookedTickets = existingBookings.reduce(
      (sum, booking) => sum + booking.tickets,
      0
    );

    if (totalBookedTickets + tickets > event.capacity) {
      return NextResponse.json(
        { error: "Not enough tickets available" },
        { status: 400 }
      );
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert([
        {
          id: crypto.randomUUID(), // Generate a unique ID
          userId,
          eventId,
          tickets: parseInt(tickets),
          totalAmount: parseFloat(totalAmount),
          paymentMethod,
          status: "CONFIRMED", // For now, we'll auto-confirm bookings
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ])
      .select("*")
      .single();

    if (bookingError) {
      throw bookingError;
    }

    // Update user profile with any new details provided during booking
    console.log("📝 User Details from booking form:", userDetails);
    if (userDetails && (userDetails.name || userDetails.phone)) {
      const updateData = {};
      if (userDetails.name) updateData.name = userDetails.name;
      if (userDetails.phone) updateData.phone = userDetails.phone;
      updateData.updatedAt = new Date().toISOString();

      console.log(
        "🔄 Updating user profile with:",
        updateData,
        "for userId:",
        userId
      );

      const { error: userUpdateError } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", userId);

      if (userUpdateError) {
        console.error("❌ Could not update user profile:", userUpdateError);
      } else {
        console.log("✅ User profile updated successfully");
      }
    }

    // Fetch user details for email (with updated information)
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("❌ Could not fetch user for email:", userError);
    } else {
      console.log("👤 Retrieved user for ticket generation:", {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      });
    }

    // Send ticket email (don't wait for it to avoid blocking response)
    // Wrap in try-catch so booking still succeeds even if email fails
    if (user && user.email) {
      setImmediate(async () => {
        try {
          console.log("Sending ticket email to:", user.email);

          // Generate ticket image
          const ticketImageBuffer = await generateTicketImage(
            booking,
            event,
            user
          );

          // Generate email HTML
          const emailHTML = generateBookingEmailHTML(booking, event, user);

          // Send email with ticket attachment
          const emailResult = await sendTicketEmail({
            to: user.email,
            subject: `🎉 Your Ticket for ${event.title} - Booking Confirmed!`,
            html: emailHTML,
            attachments: [
              {
                filename: `ticket-${booking.id}.png`,
                content: ticketImageBuffer,
                contentType: "image/png",
              },
            ],
          });

          if (emailResult.success) {
            console.log(
              "✅ Ticket email sent successfully:",
              emailResult.messageId
            );
          } else {
            console.warn(
              "⚠️ Failed to send ticket email:",
              emailResult.error || emailResult.message
            );
          }
        } catch (emailError) {
          console.error("❌ Error sending ticket email:", emailError);
          // Don't throw - we don't want email errors to affect booking
        }
      });
    }

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
