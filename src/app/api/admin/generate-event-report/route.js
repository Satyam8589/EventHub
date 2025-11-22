import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { sendTicketEmail } from "@/lib/email";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { eventId } = await request.json();

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    console.log("📊 Generating report for event:", eventId);

    // Fetch comprehensive event data
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if organizer email exists
    if (!event.organizerEmail) {
      return NextResponse.json(
        { error: "Organizer email not found for this event" },
        { status: 400 }
      );
    }

    // Fetch all bookings with user details
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select(
        `
        *,
        user:users(*)
      `
      )
      .eq("eventId", eventId)
      .order("createdAt", { ascending: false });

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError);
      return NextResponse.json(
        { error: "Failed to fetch bookings data" },
        { status: 500 }
      );
    }

    // Calculate comprehensive analytics
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter((b) => b.status === "CONFIRMED");
    const pendingBookings = bookings.filter((b) => b.status === "PENDING");
    const failedBookings = bookings.filter((b) => b.status === "FAILED");

    const totalRevenue = confirmedBookings.reduce((sum, booking) => {
      return sum + (parseFloat(booking.totalAmount) || 0);
    }, 0);

    const totalTickets = confirmedBookings.reduce((sum, booking) => {
      return sum + (parseInt(booking.tickets) || 0);
    }, 0);

    const uniqueAttendees = new Set(
      confirmedBookings.map((booking) => booking.userId)
    ).size;

    // Prepare detailed user information
    const userDetails = confirmedBookings.map((booking) => ({
      name: booking.user?.name || "Unknown",
      email: booking.user?.email || "Unknown",
      phone: booking.user?.phone || "Not provided",
      tickets: booking.tickets,
      amount: booking.totalAmount,
      bookingDate: new Date(booking.createdAt).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      }),
      paymentId: booking.paymentId,
    }));

    // Revenue by date
    const revenueByDate = {};
    confirmedBookings.forEach((booking) => {
      const date = new Date(booking.createdAt).toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
      });
      revenueByDate[date] =
        (revenueByDate[date] || 0) + parseFloat(booking.totalAmount || 0);
    });

    // Prepare data for Gemini AI
    const eventData = {
      eventInfo: {
        title: event.title || event.name,
        description: event.description,
        date: new Date(event.date).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        }),
        endDate: event.endDate
          ? new Date(event.endDate).toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
            })
          : "Not specified",
        time: event.time,
        location: event.location,
        venue: event.venue,
        capacity: event.capacity,
        price: event.price,
        category: event.category,
        organizerName: event.organizerName,
        organizerEmail: event.organizerEmail,
      },
      analytics: {
        totalBookings,
        confirmedBookings: confirmedBookings.length,
        pendingBookings: pendingBookings.length,
        failedBookings: failedBookings.length,
        totalRevenue,
        totalTickets,
        uniqueAttendees,
        capacityUtilization: event.capacity
          ? ((totalTickets / event.capacity) * 100).toFixed(2) + "%"
          : "N/A",
        averageTicketsPerBooking: (
          totalTickets / confirmedBookings.length || 0
        ).toFixed(2),
        averageRevenuePerBooking: (
          totalRevenue / confirmedBookings.length || 0
        ).toFixed(2),
      },
      revenueByDate,
      totalConfirmedBookings: confirmedBookings.length,
    };

    console.log("🤖 Sending data to Gemini AI for analysis...");

    // Generate report using Gemini AI
    // Try different model names for compatibility (using correct format with 'models/' prefix)
    let model;
    let reportHTML;
    const modelsToTry = [
      "models/gemini-2.5-flash",      // Stable version - best choice
      "models/gemini-flash-latest",    // Latest flash version
      "models/gemini-2.5-pro",         // Pro version for better quality
      "models/gemini-pro-latest"       // Fallback
    ];
    
    let lastError;
    for (const modelName of modelsToTry) {
      try {
        console.log(`Trying model: ${modelName}`);
        model = genAI.getGenerativeModel({ model: modelName });
        
        const prompt = `You are a professional event analytics expert. Analyze the following event data and create a comprehensive, professional event report.

Event Data:
${JSON.stringify(eventData, null, 2)}

Please create a detailed professional report in HTML format that includes:

1. **Executive Summary**: A brief overview of the event performance
2. **Event Details**: Key information about the event
3. **Booking Analytics**: 
   - Total bookings breakdown (confirmed, pending, failed)
   - Revenue analysis (use ₹ symbol for Indian Rupees)
   - Attendance metrics
   - Capacity utilization
4. **Financial Performance**:
   - Total revenue generated (in ₹ Indian Rupees)
   - Average revenue per booking (in ₹)
   - Revenue trends over time (in ₹)
5. **Attendee Insights**:
   - Total unique attendees
   - Average tickets per booking
   - Top booking dates
6. **Recommendations**: Data-driven insights and suggestions for future events

IMPORTANT: 
- Use ₹ (Indian Rupees) for all monetary values, NOT $ (dollars)
- DO NOT include individual user information, names, emails, or phone numbers
- Focus on aggregate statistics and trends only

Format the report as a professional HTML document with:
- Modern, clean styling
- Professional color scheme (blues, grays)
- Clear sections with headers
- Tables for data presentation
- Charts descriptions where applicable
- Professional footer

Make it look like a business report that could be presented to stakeholders.`;

        const result = await model.generateContent(prompt);
        reportHTML = result.response.text();
        
        console.log(`✅ Successfully used model: ${modelName}`);
        break; // Success! Exit the loop
      } catch (error) {
        console.log(`❌ Model ${modelName} failed:`, error.message.substring(0, 100));
        lastError = error;
        continue; // Try next model
      }
    }
    
    if (!reportHTML) {
      throw new Error(`All models failed. Last error: ${lastError?.message || 'Unknown error'}`);
    }

    console.log("✅ Report generated successfully");

    // Send email to organizer
    console.log("📧 Sending report to:", event.organizerEmail);

    const emailSubject = `Event Report: ${event.title || event.name}`;
    
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 800px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #8b5cf6 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">📊 Event Analytics Report</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Generated by EventHub</p>
          </div>
          
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              Dear ${event.organizerName || "Event Organizer"},
            </p>
            
            <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 20px;">
              Please find below the comprehensive analytics report for your event <strong>${event.title || event.name}</strong>.
              This report has been generated using AI-powered analysis of all event data, bookings, and attendee information.
            </p>
            
            <div style="background: #f3f4f6; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 0; color: #1e3a8a; font-weight: bold;">Quick Stats:</p>
              <p style="margin: 5px 0; color: #374151;">📊 Total Bookings: ${totalBookings}</p>
              <p style="margin: 5px 0; color: #374151;">✅ Confirmed: ${confirmedBookings.length}</p>
              <p style="margin: 5px 0; color: #374151;">💰 Total Revenue: ₹${totalRevenue.toLocaleString("en-IN")}</p>
              <p style="margin: 5px 0; color: #374151;">👥 Unique Attendees: ${uniqueAttendees}</p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            ${reportHTML}
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              This report was automatically generated by EventHub's AI-powered analytics system.
              For any questions or support, please contact us.
            </p>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 5px 0;"><strong>EventHub</strong> - Your Gateway to Amazing Events</p>
            <p style="margin: 5px 0;">© ${new Date().getFullYear()} EventHub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResult = await sendTicketEmail({
      to: event.organizerEmail,
      subject: emailSubject,
      html: emailHTML,
    });

    if (emailResult.success) {
      console.log("✅ Report email sent successfully");
      return NextResponse.json({
        success: true,
        message: `Report generated and sent to ${event.organizerEmail}`,
        reportPreview: reportHTML.substring(0, 500) + "...",
      });
    } else {
      console.error("❌ Failed to send email:", emailResult.error);
      return NextResponse.json(
        {
          error: "Report generated but failed to send email",
          details: emailResult.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ Error generating report:", error);
    return NextResponse.json(
      {
        error: "Failed to generate report",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
