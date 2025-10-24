import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/auth/sync-user - Sync Firebase user with our database
export async function POST(request) {
  try {
    console.log("Starting POST /api/auth/sync-user");
    console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);

    const { uid, email, name, avatar } = await request.json();

    if (!uid || !email) {
      return NextResponse.json(
        { error: "UID and email are required" },
        { status: 400 }
      );
    }

    console.log("Syncing user:", uid, email);

    // Check if user already exists in our database
    const { data: existingUsers, error: findError } = await supabase
      .from("users")
      .select("*")
      .or(`id.eq.${uid},email.eq.${email}`);

    if (findError) {
      throw findError;
    }

    let user = existingUsers?.[0];

    if (user) {
      // Update existing user (preserve existing role)
      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({
          name: name || user.name,
          avatar: avatar || user.avatar,
        })
        .eq("id", user.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }
      user = updatedUser;
      console.log("Updated existing user");
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert([
          {
            id: uid, // Use Firebase UID as our database ID
            email,
            name: name || email.split("@")[0],
            avatar,
            role: "ATTENDEE",
          },
        ])
        .select()
        .single();

      if (createError) {
        throw createError;
      }
      user = newUser;
      console.log("Created new user");
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error syncing user:", error.message);
    console.error("Error code:", error.code);
    console.error("Error details:", error);
    return NextResponse.json(
      { error: "Failed to sync user", details: error.message },
      { status: 500 }
    );
  }
}
