import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// DELETE /api/admin/events/[id]/admins/[adminId] - Remove admin from event
export async function DELETE(request, { params }) {
  try {
    const { id, adminId } = await params;

    console.log("=== REMOVING ADMIN ===");
    console.log("Event ID:", id);
    console.log("Admin ID (could be assignment ID or user ID):", adminId);

    // First try to find assignment by assignment ID
    let assignment = null;
    let assignmentError = null;

    const { data: assignmentById, error: byIdError } = await supabase
      .from("event_admins")
      .select("*")
      .eq("id", adminId)
      .eq("event_id", id)
      .single();

    if (assignmentById) {
      assignment = assignmentById;
      console.log("Found assignment by assignment ID");
    } else {
      // If not found by assignment ID, try by user ID
      const { data: assignmentByUserId, error: byUserIdError } = await supabase
        .from("event_admins")
        .select("*")
        .eq("event_id", id)
        .eq("user_id", adminId)
        .single();

      if (assignmentByUserId) {
        assignment = assignmentByUserId;
        console.log("Found assignment by user ID");
      } else {
        assignmentError = byUserIdError;
      }
    }

    if (!assignment) {
      console.error("Assignment not found:", assignmentError);
      return NextResponse.json(
        { error: "Admin assignment not found for this event" },
        { status: 404 }
      );
    }

    console.log("Assignment found:", assignment);
    const userId = assignment.user_id;

    // Remove the assignment from event_admins table
    const { error: deleteError } = await supabase
      .from("event_admins")
      .delete()
      .eq("id", assignment.id);

    if (deleteError) {
      console.error("Error removing assignment:", deleteError);
      return NextResponse.json(
        { error: "Failed to remove admin assignment" },
        { status: 500 }
      );
    }

    console.log("✅ Assignment removed from event_admins table");

    // Check if user has any other event assignments
    const { data: otherAssignments, error: checkError } = await supabase
      .from("event_admins")
      .select("*")
      .eq("user_id", userId);

    if (checkError) {
      console.error("Error checking other assignments:", checkError);
      // Continue anyway - we removed the assignment successfully
    }

    // If user has no other event assignments, revert their role to ATTENDEE
    if (!otherAssignments || otherAssignments.length === 0) {
      console.log("User has no other assignments, reverting role to ATTENDEE");
      
      const { error: updateError } = await supabase
        .from("users")
        .update({
          role: "ATTENDEE",
          updatedAt: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) {
        console.error("Error updating user role:", updateError);
        // Don't fail the request - the assignment was removed successfully
        console.log("Assignment removed but failed to update user role");
      } else {
        console.log("✅ User role updated to ATTENDEE");
      }
    } else {
      console.log("User still has other event assignments, keeping EVENT_ADMIN role");
    }

    console.log("✅ Admin removed successfully");
    return NextResponse.json({
      message: "Admin removed successfully",
      removedAssignment: {
        eventId: id,
        userId: userId,
        assignmentId: assignment.id
      }
    });
  } catch (error) {
    console.error("Error removing admin:", error);
    return NextResponse.json(
      { error: "Failed to remove admin" },
      { status: 500 }
    );
  }
}
