import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Test endpoint to check user data structure
export async function GET() {
  try {
    console.log("Testing user data structure...");

    // Get a sample user to see what fields are available
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("*")
      .limit(1);

    if (usersError) {
      console.error("Users table error:", usersError);
      return NextResponse.json({
        error: "Users table error",
        details: usersError,
      });
    }

    console.log("Sample user data:", users[0]);
    return NextResponse.json({
      success: true,
      sampleUser: users[0] || null,
      userFields: users[0] ? Object.keys(users[0]) : [],
    });
  } catch (error) {
    console.error("User test error:", error);
    return NextResponse.json({
      error: "User test failed",
      details: error.message,
    });
  }
}
