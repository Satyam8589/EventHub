import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { sendTicketEmail } from "@/lib/email";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request) {
  try {
    console.log("📧 Contact form submission received");

    const { name, email, subject, message } = await request.json();
    console.log("📝 Form data:", {
      name,
      email,
      subject,
      messageLength: message?.length,
    });

    // Validate required fields
    if (!name || !email || !subject || !message) {
      console.log("❌ Validation failed: Missing required fields");
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    console.log("💾 Attempting to save to database...");

    // Save contact message to database
    const { data: contactMessage, error: createError } = await supabase
      .from("contact_messages")
      .insert([
        {
          name,
          email,
          subject,
          message,
          status: "NEW",
        },
      ])
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    console.log("✅ Message saved to database:", contactMessage.id);

    // Generate AI-powered auto-response using Gemini
    let aiResponse = null;
    let responseGenerated = false;

    if (process.env.GEMINI_API_KEY) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `You are a helpful customer support assistant for EventHub, an event management platform. 
A user has sent us the following message:

Name: ${name}
Email: ${email}
Subject: ${subject}
Message: ${message}

Generate a professional, friendly, and helpful auto-response email that:
1. Thanks them for contacting us
2. Acknowledges their specific inquiry/concern
3. Provides relevant helpful information if possible
4. Mentions that our team will review their message and respond within 24 hours
5. Is warm and personalized
6. Is concise (2-3 paragraphs maximum)

Keep the tone professional but friendly. Do not make promises we can't keep. Focus on being helpful and reassuring.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        aiResponse = response.text();
        responseGenerated = true;

        // Update the contact message with AI response
        const { error: updateError } = await supabase
          .from("contact_messages")
          .update({
            aiResponse,
            respondedAt: new Date().toISOString(),
          })
          .eq("id", contactMessage.id);

        if (updateError) {
          console.error("Error updating contact message:", updateError);
        }

        console.log(
          "✅ AI response generated for contact message:",
          contactMessage.id
        );
      } catch (error) {
        console.error("❌ Error generating AI response:", error);
        // Continue even if AI response fails
      }
    } else {
      console.warn(
        "⚠️ GEMINI_API_KEY not configured. Skipping AI response generation."
      );
    }

    // Send notification email to admin about new contact message
    if (process.env.GMAIL_USER) {
      try {
        console.log("📧 Sending notification email to admin...");

        const adminEmailHTML = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .field { margin-bottom: 20px; }
              .field-label { font-weight: bold; color: #667eea; margin-bottom: 5px; }
              .field-value { background: white; padding: 10px; border-radius: 5px; border-left: 3px solid #667eea; }
              .message-box { background: white; padding: 15px; border-radius: 5px; border: 1px solid #ddd; white-space: pre-wrap; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
              .ai-response { background: #e8f4ff; padding: 15px; border-radius: 5px; border-left: 3px solid #2196F3; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔔 New Contact Form Submission</h1>
                <p>EventHub Contact Form</p>
              </div>
              
              <div class="content">
                <div class="field">
                  <div class="field-label">📅 Received:</div>
                  <div class="field-value">${new Date().toLocaleString()}</div>
                </div>

                <div class="field">
                  <div class="field-label">👤 Name:</div>
                  <div class="field-value">${name}</div>
                </div>

                <div class="field">
                  <div class="field-label">📧 Email:</div>
                  <div class="field-value"><a href="mailto:${email}">${email}</a></div>
                </div>

                <div class="field">
                  <div class="field-label">📋 Subject:</div>
                  <div class="field-value">${subject}</div>
                </div>

                <div class="field">
                  <div class="field-label">💬 Message:</div>
                  <div class="message-box">${message}</div>
                </div>

                ${
                  aiResponse
                    ? `
                  <div class="ai-response">
                    <div class="field-label">🤖 AI Auto-Response Sent:</div>
                    <div style="margin-top: 10px; color: #555;">${aiResponse}</div>
                  </div>
                `
                    : ""
                }

                <div class="footer">
                  <p>Message ID: ${contactMessage.id}</p>
                  <p>This is an automated notification from EventHub</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

        await sendTicketEmail({
          to: process.env.GMAIL_USER, // Send to your own email
          subject: `🔔 New Contact Form: ${subject}`,
          html: adminEmailHTML,
          attachments: [],
        });

        console.log("✅ Admin notification email sent");
      } catch (emailError) {
        console.error("❌ Error sending admin notification email:", emailError);
        // Don't fail the request if email fails
      }
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Your message has been received successfully!",
        messageId: contactMessage.id,
        aiResponse: responseGenerated ? aiResponse : null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error processing contact form:");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    return NextResponse.json(
      {
        error: "Failed to process your message. Please try again.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve contact messages (for admin use)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("contact_messages")
      .select("*")
      .order("createdAt", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: messages, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching contact messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
