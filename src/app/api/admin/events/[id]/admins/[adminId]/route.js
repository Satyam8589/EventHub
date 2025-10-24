import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// DELETE /api/admin/events/[id]/admins/[adminId] - Remove admin from event
export async function DELETE(request, { params }) {
  try {
    const { id, adminId } = await params;

    // Check if user exists and is an EVENT_ADMIN
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", adminId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Admin user not found" },
        { status: 404 }
      );
    }

    if (user.role !== "EVENT_ADMIN") {
      return NextResponse.json(
        { error: "User is not an event admin" },
        { status: 400 }
      );
    }

    // Revert user role to ATTENDEE (removing admin privileges)
    const { error: updateError } = await supabase
      .from("users")
      .update({
        role: "ATTENDEE",
        updatedAt: new Date().toISOString(),
      })
      .eq("id", adminId);

    if (updateError) {
      console.error("Error updating user role:", updateError);
      return NextResponse.json(
        { error: "Failed to remove admin privileges" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Admin removed successfully",
    });
  } catch (error) {
    console.error("Error removing admin:", error);
    return NextResponse.json(
      { error: "Failed to remove admin" },
      { status: 500 }
    );
  }
}
