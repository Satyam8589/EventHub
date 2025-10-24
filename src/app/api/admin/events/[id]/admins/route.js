import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/admin/events/[id]/admins - Get event admins
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Fetch all users with EVENT_ADMIN role
    // In a more complex system, you'd have an event_admins table to track which admins are assigned to which events
    // For now, we'll return all EVENT_ADMIN users as they can manage events
    const { data: eventAdmins, error: adminsError } = await supabase
      .from("users")
      .select("id, name, email, avatar, role, createdAt")
      .eq("role", "EVENT_ADMIN")
      .order("createdAt", { ascending: false });

    if (adminsError) {
      console.error("Error fetching event admins:", adminsError);
      return NextResponse.json(
        { error: "Failed to fetch event admins" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      admins: eventAdmins || [],
      maxAdmins: 5, // Allow up to 5 event admins
      currentCount: eventAdmins?.length || 0,
    });
  } catch (error) {
    console.error("Error fetching event admins:", error);
    return NextResponse.json(
      { error: "Failed to fetch event admins" },
      { status: 500 }
    );
  }
}

// POST /api/admin/events/[id]/admins - Assign admin to event
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { userId, assignedBy } = await request.json();

    if (!userId || !assignedBy) {
      return NextResponse.json(
        { error: "User ID and assigned by are required" },
        { status: 400 }
      );
    }

    // Check if event exists
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is eligible (not already SUPER_ADMIN or EVENT_ADMIN)
    if (user.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Super admins cannot be assigned as event admins" },
        { status: 400 }
      );
    }

    if (user.role === "EVENT_ADMIN") {
      return NextResponse.json(
        { error: "User is already an event admin" },
        { status: 400 }
      );
    }

    // Update user role to EVENT_ADMIN
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({
        role: "EVENT_ADMIN",
        updatedAt: new Date().toISOString(),
      })
      .eq("id", userId)
      .select("id, name, email, avatar, role")
      .single();

    if (updateError) {
      console.error("Error updating user role:", updateError);
      return NextResponse.json(
        { error: "Failed to assign admin role" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      eventAdmin: {
        user: updatedUser,
        eventId: id,
        assignedBy,
        assignedAt: new Date().toISOString(),
      },
      message: "Admin assigned successfully",
    });
  } catch (error) {
    console.error("Error assigning admin:", error);
    return NextResponse.json(
      { error: "Failed to assign admin" },
      { status: 500 }
    );
  }
}
