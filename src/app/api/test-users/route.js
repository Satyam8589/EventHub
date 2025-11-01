import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Get sample users
    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .limit(5);

    console.log("Users table exists:", !error);
    console.log("Sample users:", users?.length || 0);
    
    if (users && users.length > 0) {
      console.log("User fields:", Object.keys(users[0]));
    }

    return NextResponse.json({
      success: !error,
      totalUsers: users?.length || 0,
      users: users,
      userFields: users?.[0] ? Object.keys(users[0]) : [],
      error: error?.message,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
