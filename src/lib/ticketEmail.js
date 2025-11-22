import { supabase } from "@/lib/supabase";
import { sendTicketEmailWithRetry, generateBookingEmailHTML } from "@/lib/email";
import { generateTicketImage } from "@/lib/generateTicketImage";

/**
 * Send ticket email to user after successful payment
 * @param {string} bookingId - The booking ID
 * @param {object} eventInfo - Event information
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendTicketToUser(bookingId, eventInfo) {
  try {
    console.log("📧 Preparing to send ticket email for booking:", bookingId);

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      console.error("❌ Failed to fetch booking:", bookingError);
      return { success: false, error: "Booking not found" };
    }

    // Get user details
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", booking.userId)
      .single();

    if (userError || !user) {
      console.error("❌ Failed to fetch user details:", userError);
      return { success: false, error: "User not found" };
    }

    console.log("🎫 Generating full ticket image for email...");
    console.log("📊 Event data received from payment:", {
      id: eventInfo?.id,
      title: eventInfo?.title,
      imageUrl: eventInfo?.imageUrl,
      hasImageUrl: !!eventInfo?.imageUrl,
      allEventKeys: Object.keys(eventInfo || {}),
    });

    // Fetch complete event data including imageUrl
    // The eventInfo from payment verification doesn't include all fields
    const { data: completeEvent, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventInfo.id)
      .single();

    if (eventError || !completeEvent) {
      console.error("❌ Failed to fetch complete event details:", eventError);
      // Fall back to using partial event info
      console.log("⚠️ Using partial event data for ticket generation");
    } else {
      console.log("✅ Complete event data fetched successfully!");
      console.log("📋 Event fields:", {
        id: completeEvent.id,
        title: completeEvent.title,
        date: completeEvent.date,
        endDate: completeEvent.endDate,
        enddate: completeEvent.enddate,
        time: completeEvent.time,
        endTime: completeEvent.endTime,
        endtime: completeEvent.endtime,
        hasImageUrl: !!completeEvent.imageUrl,
        imageUrl: completeEvent.imageUrl?.substring(0, 50) + "...",
        allKeys: Object.keys(completeEvent),
      });
      
      // Check if it's a multi-day event
      const hasEndDate = !!(completeEvent.endDate || completeEvent.enddate);
      console.log("🗓️ Multi-day check:", {
        hasEndDate,
        endDateValue: completeEvent.endDate || completeEvent.enddate,
        isMultiDay: hasEndDate && new Date(completeEvent.endDate || completeEvent.enddate) > new Date(completeEvent.date),
      });
    }

    // Use complete event data if available, otherwise fall back to eventInfo
    const eventDataForTicket = completeEvent || eventInfo;

    // Generate the full ticket image (same as download from My Events)
    const ticketImageBuffer = await generateTicketImage(booking, eventDataForTicket, user);

    console.log("✅ Ticket image generated successfully");

    // Generate email HTML
    const emailHTML = generateBookingEmailHTML(booking, eventInfo, user);

    // Send email with the full ticket image attachment
    const emailResult = await sendTicketEmailWithRetry({
      to: user.email,
      subject: `🎉 Your Ticket for ${eventInfo.title}`,
      html: emailHTML,
      attachments: [
        {
          filename: `EventHub-Ticket-${booking.id.slice(-8).toUpperCase()}.png`,
          content: ticketImageBuffer,
          contentType: "image/png",
        },
      ],
    });

    if (emailResult.success) {
      console.log("✅ Ticket email sent successfully to:", user.email);
      return { success: true };
    } else {
      console.error("❌ Failed to send ticket email:", emailResult.error);
      return { success: false, error: emailResult.error };
    }
  } catch (error) {
    console.error("❌ Error in sendTicketToUser:", error);
    return { success: false, error: error.message };
  }
}
