import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/auth/sync-user - Sync Firebase user with our database
export async function POST(request) {
  try {
    console.log("=== SYNC-USER API CALLED ===");
    console.log("Request method:", request.method);
    console.log(
      "Request headers:",
      Object.fromEntries(request.headers.entries())
    );

    let requestBody;
    try {
      requestBody = await request.json();
      console.log("Request body:", requestBody);
    } catch (jsonError) {
      console.error("JSON parsing error:", jsonError);
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { uid, email, name, avatar, phone } = requestBody;

    if (!uid || !email) {
      return NextResponse.json(
        { error: "UID and email are required" },
        { status: 400 }
      );
    }

    console.log("Syncing user:", uid, email);

    // Check if user already exists in our database
    let user = null;

    // First check by ID
    const { data: userById, error: idError } = await supabase
      .from("users")
      .select("*")
      .eq("id", uid)
      .single();

    if (idError && idError.code !== "PGRST116") {
      console.error("Error finding user by ID:", idError);
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
        console.error("Error finding user by email:", emailError);
      } else if (userByEmail) {
        user = userByEmail;
      }
    }

    console.log("Found existing user:", !!user, user?.email);

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
      console.log("Updated existing user");
    } else {
      // Create new user
      console.log("Creating new user with:", { uid, email, name, phone });
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
        console.error("Error creating user:", createError);
        throw createError;
      }
      user = newUser;
      console.log("Created new user successfully:", user?.id);
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
