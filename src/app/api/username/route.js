import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET - Get user's username
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("username")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching username:", error);
      return NextResponse.json({ username: null }, { status: 200 });
    }

    return NextResponse.json({ username: user?.username || null });
  } catch (error) {
    console.error("Error in GET /api/username:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Set/Update username
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, username } = body;

    if (!userId || !username) {
      return NextResponse.json(
        { error: "User ID and username are required" },
        { status: 400 }
      );
    }

    // Validate username format
    const usernameRegex = /^[a-z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        {
          error:
            "Username must be 3-20 characters long and contain only lowercase letters, numbers, and underscores",
        },
        { status: 400 }
      );
    }

    // Check if username is already taken
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .neq("id", userId)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 }
      );
    }

    // Check if user already has a username set (prevent updates)
    const { data: currentUser } = await supabase
      .from("users")
      .select("username")
      .eq("id", userId)
      .single();

    if (currentUser?.username) {
      return NextResponse.json(
        { error: "Username already set and cannot be changed" },
        { status: 400 }
      );
    }

    // Update username
    const { data: updatedUser, error } = await supabase
      .from("users")
      .update({ username })
      .eq("id", userId)
      .select("username")
      .single();

    if (error) {
      console.error("Error updating username:", error);
      return NextResponse.json(
        { error: "Failed to update username" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      username: updatedUser.username,
    });
  } catch (error) {
    console.error("Error in POST /api/username:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
