import { NextResponse } from "next/server";
const nodemailer = require("nodemailer");

// Email configuration
const createEmailTransporter = () => {
  // Using your Gmail SMTP configuration with explicit SMTP settings
  const config = {
    service: "gmail", // Use Gmail service which handles all the SMTP settings automatically
    auth: {
      user: process.env.GMAIL_USER, // Your Gmail address from .env.local
      pass: process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, ""), // Remove any spaces from app password
    },
  };

  console.log("ðŸ”§ Creating transporter with config:", {
    service: config.service,
    user: config.auth.user,
    hasPassword: !!config.auth.pass,
    passwordLength: config.auth.pass?.length || 0,
    cleanedPassword: config.auth.pass?.replace(/./g, "*"),
  });

  return nodemailer.createTransport(config);
};

// Function to send email
async function sendContactEmail({ name, email, subject, message }) {
  try {
    console.log(
      "GMAIL_APP_PASSWORD format check:",
      process.env.GMAIL_APP_PASSWORD?.replace(/./g, "*")
    );
    const transporter = createEmailTransporter();

    // Test the transporter connection
    try {
      await transporter.verify();
    } catch (verifyError) {
      throw new Error(`Email connection failed: ${verifyError.message}`);
    }

    // Email to you (the site owner)
    const mailOptions = {
      from: process.env.GMAIL_USER, // Sending Gmail account (gabbar656521@gmail.com)
      to: process.env.CONTACT_EMAIL || "join.eventhub@gmail.com", // Your contact email
      replyTo: email, // Set reply-to as the form submitter's email
      subject: `Contact Form: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">New Contact Form Submission</h2>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <div style="background: white; padding: 15px; border-radius: 4px; border-left: 4px solid #3b82f6;">
              ${message.replace(/\n/g, "<br>")}
            </div>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Submitted on: ${new Date().toLocaleString()}
          </p>
        </div>
      `,
      text: `
        New Contact Form Submission
        
        Name: ${name}
        Email: ${email}
        Subject: ${subject}
        
        Message:
        ${message}
        
        Submitted on: ${new Date().toLocaleString()}
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    // Provide more specific error messages
    let userFriendlyError = error.message;
    if (error.code === "EAUTH" || error.responseCode === 535) {
      userFriendlyError =
        "Email authentication failed. Please check Gmail credentials.";
    } else if (error.code === "ENOTFOUND") {
      userFriendlyError =
        "Email server connection failed. Please check internet connection.";
    }

    return { success: false, error: userFriendlyError };
  }
}

export async function POST(request) {
  try {
    const { name, email, subject, message } = await request.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Log the submission
    console.log("Contact form submission:", {
      name,
      email,
      subject,
      message,
      timestamp: new Date().toISOString(),
    });

    // Store message in database first (as backup)
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: dbResult, error: dbError } = await supabase
        .from("contact_messages")
        .insert([
          {
            name,
            email,
            subject,
            message,
            status: "pending",
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (dbError) {
        console.log(
          "ðŸ“ Database storage failed (continuing anyway):",
          dbError.message
        );
      } else {
      }
    } catch (dbError) {
      console.log(
        "ðŸ“ Database not available (continuing anyway):",
        dbError.message
      );
    }

    // Try to send email (but don't fail the request if it doesn't work)
    let emailSent = false;
    try {
      const emailResult = await sendContactEmail({
        name,
        email,
        subject,
        message,
      });

      if (emailResult.success) {
        emailSent = true;
      } else {
      }
    } catch (emailError) {
    }

    // Return success response (always succeed, even if email fails)
    return NextResponse.json(
      {
        success: true,
        message: emailSent
          ? "Thank you for your message! We'll get back to you soon."
          : "Thank you for your message! We've received it and will get back to you soon.",
        aiResponse:
          "Thank you for reaching out to EventHub! We've received your message and our team will respond within 24 hours.",
        emailDelivered: emailSent,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 }
    );
  }
}
