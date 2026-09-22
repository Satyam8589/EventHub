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
      // Update existing user (preserve existing role, and sync id to uid if changed)
      const updatePayload = {
        name: name || user.name,
        avatar: avatar || user.avatar,
        phone: phone || user.phone,
        updatedAt: new Date().toISOString(),
      };

      if (user.id !== uid) {
        updatePayload.id = uid;
      }

      let { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update(updatePayload)
        .eq("id", user.id)
        .select()
        .single();

      // If updating ID failed (e.g. FK constraints), retry without changing ID
      if (updateError && user.id !== uid) {
        delete updatePayload.id;
        const retry = await supabase
          .from("users")
          .update(updatePayload)
          .eq("id", user.id)
          .select()
          .single();
        updatedUser = retry.data;
        updateError = retry.error;
      }

      if (updateError) {
        console.error("Error updating user in Supabase:", updateError);
        throw updateError;
      }
      user = updatedUser;
    } else {
      // Create new user
      const userData = {
        id: uid, // Use Firebase UID as our database ID
        email,
        name: name || email.split("@")[0],
        phone: phone || null,
        avatar: avatar || null,
        role: "ATTENDEE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      let { data: newUser, error: createError } = await supabase
        .from("users")
        .insert([userData])
        .select()
        .single();

      // If failed due to role or column naming differences, attempt fallback
      if (createError) {
        console.warn("Initial sync insert failed, attempting fallback:", createError.message);
        
        const fallbackUserData = {
          id: uid,
          email,
          name: name || email.split("@")[0],
          phone: phone || null,
          avatar: avatar || null,
          image: avatar || null,
          role: "USER",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: fallbackUser, error: fallbackError } = await supabase
          .from("users")
          .insert([fallbackUserData])
          .select()
          .single();

        if (fallbackError) {
          console.error("Supabase user sync fallback also failed:", fallbackError);
          throw createError;
        }
        newUser = fallbackUser;
      }

      user = newUser;
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Critical error in /api/auth/sync-user:", error);
    return NextResponse.json(
      { error: "Failed to sync user", details: error.message },
      { status: 500 }
    );
  }
}
