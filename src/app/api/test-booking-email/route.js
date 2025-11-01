import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("🧪 Testing booking email flow...");

    // Import the email functions
    const { sendTicketEmail, generateBookingEmailHTML } = await import(
      "../../../lib/email"
    );
    const { generateTicketImage } = await import(
      "../../../lib/generateTicketImage"
    );

    // Mock data for testing
    const mockBooking = {
      id: "test-booking-" + Date.now(),
      tickets: 2,
      totalAmount: 1000,
      status: "CONFIRMED",
      createdAt: new Date().toISOString(),
    };

    const mockEvent = {
      id: "test-event",
      title: "Test Event for Email",
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      time: "18:00",
      location: "Test Venue",
      venue: "Test Hall",
      organizerName: "Test Organizer",
    };

    const mockUser = {
      id: "test-user",
      name: "Test User",
      email: process.env.GMAIL_USER, // Send to self for testing
      phone: "+1234567890",
    };

    console.log("📧 Testing email functions availability...");
    console.log("sendTicketEmail available:", !!sendTicketEmail);
    console.log(
      "generateBookingEmailHTML available:",
      !!generateBookingEmailHTML
    );
    console.log("generateTicketImage available:", !!generateTicketImage);

    if (!sendTicketEmail || !generateBookingEmailHTML || !generateTicketImage) {
      return NextResponse.json({
        success: false,
        error: "Email functions not available",
        functions: {
          sendTicketEmail: !!sendTicketEmail,
          generateBookingEmailHTML: !!generateBookingEmailHTML,
          generateTicketImage: !!generateTicketImage,
        },
      });
    }

    // Generate ticket image
    console.log("🎨 Generating ticket image...");
    const ticketImageBuffer = await generateTicketImage(
      mockBooking,
      mockEvent,
      mockUser
    );

    // Generate email HTML
    console.log("📄 Generating email HTML...");
    const emailHTML = generateBookingEmailHTML(
      mockBooking,
      mockEvent,
      mockUser
    );

    // Send test email
    console.log("📧 Sending test booking email...");
    const emailResult = await sendTicketEmail({
      to: mockUser.email,
      subject: `🧪 Test Booking Email - ${mockEvent.title}`,
      html: emailHTML,
      attachments: [
        {
          filename: `test-ticket-${mockBooking.id}.png`,
          content: ticketImageBuffer,
          contentType: "image/png",
        },
      ],
    });

    if (emailResult.success) {
      return NextResponse.json({
        success: true,
        message: "Test booking email sent successfully!",
        messageId: emailResult.messageId,
        recipient: mockUser.email,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: "Failed to send test booking email",
        details: emailResult.error || emailResult.message,
      });
    }
  } catch (error) {
    console.error("❌ Test booking email failed:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
}
