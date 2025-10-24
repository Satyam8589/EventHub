import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// DELETE /api/admin/events/[id]/admins/[adminId] - Remove admin from event
export async function DELETE(request, { params }) {
  try {
    const { id, adminId } = await params;

    // Check if event admin exists
    const eventAdmin = await prisma.eventAdmin.findUnique({
      where: { id: adminId },
      include: { user: true },
    });

    if (!eventAdmin) {
      return NextResponse.json(
        { error: "Event admin not found" },
        { status: 404 }
      );
    }

    // Remove the admin assignment
    await prisma.eventAdmin.delete({
      where: { id: adminId },
    });

    // Check if user has any other admin assignments
    const otherAdminAssignments = await prisma.eventAdmin.findMany({
      where: { userId: eventAdmin.userId },
    });

    // If no other admin assignments, revert role to ATTENDEE
    if (otherAdminAssignments.length === 0) {
      await prisma.user.update({
        where: { id: eventAdmin.userId },
        data: { role: "ATTENDEE" },
      });
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
