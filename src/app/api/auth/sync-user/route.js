import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/auth/sync-user - Sync Firebase user with our database
export async function POST(request) {
  try {
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (jsonError) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { uid, email, name, avatar, phone } = requestBody;

    if (!uid || !email) {
      return NextResponse.json(
        { error: "UID and email are required" },
        { status: 400 }
      );
    }

    // Check if user already exists in our database
    let user = null;

    // First check by ID
    const { data: userById, error: idError } = await supabase
      .from("users")
      .select("*")
      .eq("id", uid)
      .single();

    if (idError && idError.code !== "PGRST116") {
    } else if (userById) {
      user = userById;
    }

    // If not found by ID, check by email
    if (!user) {
      const { data: userByEmail, error: emailError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

      if (emailError && emailError.code !== "PGRST116") {
      } else if (userByEmail) {
        user = userByEmail;
      }
    }

    if (user) {
      // Update existing user (preserve existing role)
      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({
          name: name || user.name,
          avatar: avatar || user.avatar,
          phone: phone || user.phone,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }
      user = updatedUser;
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert([
          {
            id: uid, // Use Firebase UID as our database ID
            email,
            name: name || email.split("@")[0],
            phone: phone || null,
            avatar,
            role: "ATTENDEE",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (createError) {
        throw createError;
      }
      user = newUser;
    }

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to sync user", details: error.message },
      { status: 500 }
    );
  }
}
