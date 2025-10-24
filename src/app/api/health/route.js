import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/health - Health check endpoint
export async function GET() {
  try {
    console.log("Health check started");
    
    // Check environment variables
    const envCheck = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV,
    };
    
    console.log("Environment check:", envCheck);
    
    // Try to fetch one event to test database connection
    const { data: events, error } = await supabase
      .from("events")
      .select("id, title")
      .limit(1);
    
    if (error) {
      console.error("Database query error:", error);
      return NextResponse.json({
        status: "unhealthy",
        message: "Database connection failed",
        error: error.message,
        env: envCheck,
      }, { status: 500 });
    }
    
    return NextResponse.json({
      status: "healthy",
      message: "API is working correctly",
      timestamp: new Date().toISOString(),
      eventCount: events?.length || 0,
      sampleEvent: events?.[0] || null,
      env: envCheck,
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json({
      status: "error",
      message: error.message,
    }, { status: 500 });
  }
}
