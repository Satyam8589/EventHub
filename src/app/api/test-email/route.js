import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Test email configuration
export async function GET() {
  try {
    console.log("🧪 Testing email configuration...");

    // Check environment variables
    const emailConfig = {
      GMAIL_USER: process.env.GMAIL_USER,
      GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD ? "SET" : "MISSING",
    };

    console.log("📋 Email config:", emailConfig);

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return NextResponse.json({
        success: false,
        error: "Missing email configuration",
        config: emailConfig,
      });
    }

    // Create transporter
    const transporter = nodemailer.createTransporter({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // Test connection
    console.log("🔍 Testing email connection...");
    await transporter.verify();
    console.log("✅ Email connection verified!");

    // Send test email
    const testEmail = {
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER,
      subject: "Test Email from EventHub Contact Form",
      html: `
        <h2>🧪 Test Email</h2>
        <p>This is a test email to verify your EventHub contact form is working.</p>
        <p>If you receive this email, your contact form email functionality is configured correctly!</p>
        <p>Time: ${new Date().toISOString()}</p>
      `,
    };

    console.log("📧 Sending test email...");
    const result = await transporter.sendMail(testEmail);
    console.log("✅ Test email sent:", result.messageId);

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully!",
      messageId: result.messageId,
      config: emailConfig,
    });
  } catch (error) {
    console.error("❌ Email test failed:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
}
