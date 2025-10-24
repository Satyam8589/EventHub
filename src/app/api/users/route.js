import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/users - Get all users
export async function GET() {
  try {
    const { data: users, error } = await supabase
      .from("users")
      .select(`
        id,
        name,
        email,
        role,
        createdAt
      `)
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
}// POST /api/users - Create a new user
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
