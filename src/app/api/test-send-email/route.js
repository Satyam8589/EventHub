import { NextResponse } from "next/server";

// Simple test email API to bypass potential issues
export async function GET() {
  return NextResponse.json({
    message: "Test email API is running",
    timestamp: new Date().toISOString(),
    status: "active"
  });
}

export async function POST(request) {
  try {
    console.log("🧪 Test Email API - POST method called");
    
    // Simple email test without external dependencies
    const body = await request.json();
    console.log("Request body:", body);
    
    // Simulate email sending success
    return NextResponse.json({
      success: true,
      message: "Test email API working",
      received: body,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Test email API error:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}