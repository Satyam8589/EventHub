import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/admin/events/[id]/admins - Get event admins
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    // Get event with its admins
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        eventAdmins: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({
      admins: event.eventAdmins,
      maxAdmins: 2,
      currentCount: event.eventAdmins.length,
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
    const event = await prisma.event.findUnique({
      where: { id },
      include: { eventAdmins: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if event already has 2 admins
    if (event.eventAdmins.length >= 2) {
      return NextResponse.json(
        { error: "Event already has maximum number of admins (2)" },
        { status: 400 }
      );
    }

    // Check if user exists and is not already an admin of any event
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { eventAdminFor: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is already admin of another event
    if (user.eventAdminFor.length > 0) {
      const existingEvent = await prisma.event.findUnique({
        where: { id: user.eventAdminFor[0].eventId },
        select: { title: true },
      });
      return NextResponse.json(
        {
          error: `User is already admin of event: ${existingEvent?.title}. A user can only be admin of one event at a time.`,
        },
        { status: 400 }
      );
    }

    // Check if user is already admin of this event
    const existingAdmin = await prisma.eventAdmin.findUnique({
      where: { userId_eventId: { userId, eventId: id } },
    });

    if (existingAdmin) {
      return NextResponse.json(
        { error: "User is already admin of this event" },
        { status: 400 }
      );
    }

    // Create event admin assignment
    const eventAdmin = await prisma.eventAdmin.create({
      data: {
        userId,
        eventId: id,
        assignedBy,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // Update user role to EVENT_ADMIN if not already
    await prisma.user.update({
      where: { id: userId },
      data: { role: "EVENT_ADMIN" },
    });

    return NextResponse.json({
      eventAdmin,
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
