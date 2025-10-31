import { NextResponse } from "next/server";

let sendTicketEmail;
try {
  const emailFunctions = require("@/lib/email");
  sendTicketEmail = emailFunctions.sendTicketEmail;
} catch (e) {
  // ignore
}

export async function GET() {
  if (!sendTicketEmail) {
    return NextResponse.json(
      { success: false, error: "sendTicketEmail not available" },
      { status: 500 }
    );
  }

  try {
    const result = await sendTicketEmail({
      to: process.env.GMAIL_USER,
      subject: "EventHub Test Email",
      html: `<h1>EventHub Test Email</h1><p>If you received this, your SMTP config works!</p>`,
      attachments: [
        {
          filename: "test.txt",
          content: "This is a test attachment from EventHub.",
          contentType: "text/plain",
        },
      ],
    });
    return NextResponse.json({
      success: result.success,
      messageId: result.messageId || result.error,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
