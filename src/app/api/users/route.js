import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/users - Get all users or specific user by username
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    // If username is provided, fetch specific user
    if (username) {
      const { data: user, error } = await supabase
        .from("users")
        .select("id, name, email, username, avatar, role, createdAt")
        .eq("username", username)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
        }
        throw error;
      }

      return NextResponse.json(user);
    }

    // Otherwise, fetch all users
    const { data: users, error } = await supabase
      .from("users")
      .select(
        `
        id,
        name,
        email,
        role,
        createdAt
      `
      )
      .order("createdAt", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
} // POST /api/users - Create a new user
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, role = "ATTENDEE" } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    const { data: user, error: createError } = await supabase
      .from("users")
      .insert({
        name,
        email,
        phone,
        role,
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
