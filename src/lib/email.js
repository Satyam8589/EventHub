import nodemailer from "nodemailer";

// Create reusable transporter
let transporter = null;

function getTransporter() {
  if (!transporter) {
    // Check if Gmail credentials are provided
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.warn(
        "Gmail credentials not configured. Email sending will be disabled."
      );
      return null;
    }

    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

export async function sendTicketEmail({ to, subject, html, attachments }) {
  try {
    const transport = getTransporter();

    if (!transport) {
      console.warn("Email transporter not configured. Skipping email send.");
      return { success: false, message: "Email not configured" };
    }

    const mailOptions = {
      from: `EventHub <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
      attachments,
    };

    const info = await transport.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
}

export function generateBookingEmailHTML(booking, event, user) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .header {
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #8b5cf6 100%);
          padding: 40px 30px;
          text-align: center;
          color: white;
        }
        .header h1 {
          margin: 0;
          font-size: 32px;
          font-weight: bold;
        }
        .header p {
          margin: 10px 0 0 0;
          font-size: 18px;
          opacity: 0.9;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 20px;
          color: #1e3a8a;
          margin-bottom: 20px;
          font-weight: 600;
        }
        .message {
          font-size: 16px;
          line-height: 1.8;
          color: #374151;
          margin-bottom: 30px;
        }
        .event-card {
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          border-radius: 15px;
          padding: 25px;
          margin: 25px 0;
          border-left: 5px solid #3b82f6;
        }
        .event-title {
          font-size: 24px;
          font-weight: bold;
          color: #1e3a8a;
          margin-bottom: 15px;
        }
        .event-detail {
          display: flex;
          align-items: center;
          margin: 10px 0;
          font-size: 15px;
          color: #4b5563;
        }
        .event-detail-icon {
          margin-right: 10px;
          font-size: 18px;
        }
        .booking-info {
          background: #fef3c7;
          border-radius: 12px;
          padding: 20px;
          margin: 25px 0;
          border: 2px dashed #f59e0b;
        }
        .booking-info-title {
          font-size: 18px;
          font-weight: bold;
          color: #92400e;
          margin-bottom: 10px;
        }
        .booking-info-detail {
          font-size: 15px;
          color: #78350f;
          margin: 8px 0;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: white;
          text-decoration: none;
          padding: 15px 40px;
          border-radius: 30px;
          font-size: 16px;
          font-weight: bold;
          margin: 20px 0;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
        }
        .footer {
          background: #f9fafb;
          padding: 30px;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
          border-top: 1px solid #e5e7eb;
        }
        .footer p {
          margin: 5px 0;
        }
        .highlight {
          color: #3b82f6;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Booking Confirmed!</h1>
          <p>Your ticket awaits you</p>
        </div>
        
        <div class="content">
          <div class="greeting">Hello ${user.name}! 👋</div>
          
          <div class="message">
            <p>Great news! Your booking for <span class="highlight">${
              event.title
            }</span> has been confirmed successfully. We're thrilled to have you join us for this amazing event!</p>
            <p>Your ticket is attached to this email. Please save it on your device and present the QR code at the event entrance for a smooth check-in experience.</p>
          </div>

          <div class="event-card">
            <div class="event-title">${event.title}</div>
            <div class="event-detail">
              <span class="event-detail-icon">📅</span>
              <span>${new Date(event.date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}</span>
            </div>
            <div class="event-detail">
              <span class="event-detail-icon">⏰</span>
              <span>${event.time}</span>
            </div>
            <div class="event-detail">
              <span class="event-detail-icon">📍</span>
              <span>${event.location}</span>
            </div>
            <div class="event-detail">
              <span class="event-detail-icon">🏢</span>
              <span>${event.venue}</span>
            </div>
          </div>

          <div class="booking-info">
            <div class="booking-info-title">📋 Booking Details</div>
            <div class="booking-info-detail"><strong>Booking ID:</strong> ${
              booking.id
            }</div>
            <div class="booking-info-detail"><strong>Number of Tickets:</strong> ${
              booking.tickets
            }</div>
            <div class="booking-info-detail"><strong>Total Amount:</strong> ₹${booking.totalAmount.toLocaleString()}</div>
            <div class="booking-info-detail"><strong>Status:</strong> ${
              booking.status
            }</div>
          </div>

          <div class="message">
            <p><strong>What to do next:</strong></p>
            <ul style="color: #374151; line-height: 1.8;">
              <li>📱 Save the attached ticket image on your phone</li>
              <li>🎟️ Present the QR code at the event entrance</li>
              <li>⏰ Arrive 15-30 minutes before the event starts</li>
              <li>📧 Keep this email for your records</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">Need help or have questions?</p>
            <p style="color: #6b7280; font-size: 14px;">Contact the organizer: <span class="highlight">${
              event.organizerName || "Event Organizer"
            }</span></p>
          </div>
        </div>

        <div class="footer">
          <p><strong>EventHub</strong> - Your Gateway to Amazing Events</p>
          <p>This is an automated confirmation email. Please do not reply to this message.</p>
          <p style="margin-top: 15px; font-size: 12px;">© ${new Date().getFullYear()} EventHub. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
