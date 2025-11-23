import { supabase } from "@/lib/supabase";
import { sendTicketEmailWithRetry } from "@/lib/email";

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

    // Generate ticket view URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://eventhub.vercel.app';
    const ticketUrl = `${siteUrl}/my-events`;

    // Format date and time
    const eventDate = new Date(eventInfo.date).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Generate beautiful email HTML
    const emailHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background-color: #f3f4f6;
              margin: 0;
              padding: 20px;
              line-height: 1.6;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
            }
            .header p {
              margin: 10px 0 0 0;
              opacity: 0.9;
              font-size: 16px;
            }
            .content {
              padding: 40px 30px;
            }
            .greeting {
              font-size: 18px;
              color: #111827;
              margin-bottom: 20px;
            }
            .event-details {
              background: #f9fafb;
              border-left: 4px solid #3b82f6;
              padding: 20px;
              margin: 25px 0;
              border-radius: 8px;
            }
            .event-details h2 {
              margin: 0 0 15px 0;
              color: #111827;
              font-size: 20px;
            }
            .detail-row {
              display: flex;
              padding: 8px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              font-weight: 600;
              color: #6b7280;
              min-width: 120px;
            }
            .detail-value {
              color: #111827;
              flex: 1;
            }
            .button-container {
              text-align: center;
              margin: 35px 0;
            }
            .button {
              display: inline-block;
              padding: 16px 40px;
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
              transition: transform 0.2s;
            }
            .button:hover {
              transform: translateY(-2px);
            }
            .info-box {
              background: #eff6ff;
              border: 1px solid #bfdbfe;
              border-radius: 8px;
              padding: 15px;
              margin: 25px 0;
              color: #1e40af;
            }
            .footer {
              text-align: center;
              padding: 30px;
              color: #6b7280;
              font-size: 14px;
              border-top: 1px solid #e5e7eb;
            }
            .footer a {
              color: #3b82f6;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Booking Confirmed!</h1>
              <p>Your ticket is ready</p>
            </div>
            
            <div class="content">
              <p class="greeting">Hi ${user.name},</p>
              
              <p>Great news! Your booking for <strong>${eventInfo.title}</strong> has been confirmed and your payment has been processed successfully.</p>
              
              <div class="event-details">
                <h2>📋 Event Details</h2>
                <div class="detail-row">
                  <span class="detail-label">📅 Date:</span>
                  <span class="detail-value">${eventDate}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">🕐 Time:</span>
                  <span class="detail-value">${eventInfo.time}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">📍 Location:</span>
                  <span class="detail-value">${eventInfo.location}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">🎫 Tickets:</span>
                  <span class="detail-value">${booking.tickets} ${booking.tickets === 1 ? 'ticket' : 'tickets'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">💰 Amount Paid:</span>
                  <span class="detail-value">₹${booking.totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">🔖 Booking ID:</span>
                  <span class="detail-value">${booking.id.slice(-8).toUpperCase()}</span>
                </div>
              </div>
              
              <div class="button-container">
                <a href="${ticketUrl}" class="button">View Your Ticket</a>
              </div>
              
              <div class="info-box">
                <strong>📱 Access Your Ticket Anytime</strong><br>
                Click the button above to view and download your ticket with QR code. You can also access it anytime from the "My Events" section on EventHub.
              </div>
              
              <p>Please present your ticket (with QR code) at the event entrance for verification.</p>
              
              <p>We're excited to see you at the event!</p>
              
              <p style="margin-top: 30px;">
                Best regards,<br>
                <strong>The EventHub Team</strong>
              </p>
            </div>
            
            <div class="footer">
              <p>Need help? Contact us at <a href="mailto:support@eventhub.com">support@eventhub.com</a></p>
              <p style="margin-top: 10px; font-size: 12px; color: #9ca3af;">
                This is an automated email. Please do not reply to this message.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email
    const emailResult = await sendTicketEmailWithRetry({
      to: user.email,
      subject: `🎉 Your Ticket for ${eventInfo.title}`,
      html: emailHTML,
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
