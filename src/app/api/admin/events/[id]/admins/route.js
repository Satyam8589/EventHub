import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/admin/events/[id]/admins - Get admins assigned to a specific event
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

    // Get EVENT_ADMIN users assigned to this specific event using junction table
    // First get the assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from("event_admins")
      .select("*")
      .eq("event_id", id)
      .order("assigned_at", { ascending: false });

    if (assignmentsError) {
      console.error("Error fetching event assignments:", assignmentsError);
      return NextResponse.json(
        { error: "Failed to fetch event assignments" },
        { status: 500 }
      );
    }

    console.log("Found event assignments:", assignments?.length || 0);

    if (!assignments || assignments.length === 0) {
      return NextResponse.json({
        admins: [],
        maxAdmins: 5,
        currentCount: 0,
      });
    }

    // Get user details for each assignment
    const userIds = assignments.map((a) => a.user_id);
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, name, email, avatar, role, createdAt")
      .in("id", userIds);

    if (usersError) {
      console.error("Error fetching user details:", usersError);
      return NextResponse.json(
        { error: "Failed to fetch user details" },
        { status: 500 }
      );
    }

    // Combine assignments with user data
    const formattedAdmins = assignments.map((assignment) => {
      const user = users.find((u) => u.id === assignment.user_id);
      return {
        id: assignment.id,
        userId: assignment.user_id,
        eventId: assignment.event_id,
        assignedAt: assignment.assigned_at,
        assignedBy: assignment.assigned_by,
        name: user?.name,
        email: user?.email,
        avatar: user?.avatar,
        role: user?.role,
        createdAt: user?.createdAt,
      };
    });

    return NextResponse.json({
      admins: formattedAdmins,
      maxAdmins: 5, // Allow up to 5 event admins per event
      currentCount: formattedAdmins.length,
    });
  } catch (error) {
    console.error("Error fetching event admins:", error);
    return NextResponse.json(
      { error: "Failed to fetch event admins" },
      { status: 500 }
    );
  }
}

// POST /api/admin/events/[id]/admins - Assign admin to specific event
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId, assignedBy } = body;

    console.log("=== ADMIN ASSIGNMENT REQUEST ===");
    console.log("Event ID:", id);
    console.log("Request body:", body);
    console.log("User ID:", userId);
    console.log("Assigned by:", assignedBy);

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

    console.log("User lookup result:", { user, userError, userId });

    if (userError || !user) {
      console.error("❌ User not found:", { userError, userId });
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("Found user:", {
      id: user.id,
      name: user.name,
      role: user.role,
    });

    // Check if user is a SUPER_ADMIN
    if (user.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Super admins cannot be assigned as event admins" },
        { status: 400 }
      );
    }

    // Update user role to EVENT_ADMIN if needed
    if (user.role !== "EVENT_ADMIN") {
      console.log("🔄 Updating user role for userId:", userId);

      const { error: roleUpdateError } = await supabase
        .from("users")
        .update({
          role: "EVENT_ADMIN",
          updatedAt: new Date().toISOString(),
        })
        .eq("id", userId);

      if (roleUpdateError) {
        console.error("❌ Error updating user role:", roleUpdateError);
        return NextResponse.json(
          {
            error: "Failed to update user role",
            details: roleUpdateError?.message || "Unknown error",
          },
          { status: 500 }
        );
      }
    }

    // Check if user is already assigned to this event
    const { data: existingAssignment, error: checkError } = await supabase
      .from("event_admins")
      .select("*")
      .eq("event_id", id)
      .eq("user_id", userId)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("❌ Error checking existing assignment:", checkError);
      return NextResponse.json(
        { error: "Failed to check existing assignment" },
        { status: 500 }
      );
    }

    if (existingAssignment) {
      return NextResponse.json(
        { error: "User is already assigned to this event" },
        { status: 400 }
      );
    }

    // Add assignment to event_admins junction table
    console.log("🔄 Adding event assignment to junction table");
    const { error: assignmentError } = await supabase
      .from("event_admins")
      .insert({
        event_id: id,
        user_id: userId,
        assigned_by: assignedBy,
      });

    if (assignmentError) {
      console.error("❌ Error creating event assignment:", assignmentError);
      return NextResponse.json(
        {
          error: "Failed to assign admin to event",
          details: assignmentError?.message || "Unknown error",
        },
        { status: 500 }
      );
    }

    // Success response - simple approach
    return NextResponse.json({
      eventAdmin: {
        id: userId,
        userId: userId,
        eventId: id,
        assignedAt: new Date().toISOString(),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: "EVENT_ADMIN",
        },
      },
      message: `Admin role assigned successfully. User can now manage events.`,
    });
  } catch (error) {
    console.error("❌ Error assigning admin:", error);
    return NextResponse.json(
      {
        error: "Failed to assign admin",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
