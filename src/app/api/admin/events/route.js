import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/events - Get events for admin
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminUserId = searchParams.get("adminUserId");

    let events;

    if (adminUserId) {
      // Event Admin - get only assigned events
      const eventAdminAssignments = await prisma.eventAdmin.findMany({
        where: { userId: adminUserId },
        include: {
          event: {
            include: {
              _count: {
                select: {
                  bookings: true,
                },
              },
            },
          },
        },
      });

      events = eventAdminAssignments.map((assignment) => assignment.event);
    } else {
      // Super Admin - get all events
      events = await prisma.event.findMany({
        include: {
          _count: {
            select: {
              bookings: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching admin events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

// POST /api/admin/events - Create new event (Super Admin only)
export async function POST(request) {
  try {
    const data = await request.json();
    const {
      title,
      description,
      category,
      location,
      venue,
      date,
      time,
      price,
      capacity,
      imageUrl,
      tags,
      organizerId,
    } = data;

    // Validate required fields
    if (!title || !description || !date || !time || !location || !organizerId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create the event
    const event = await prisma.event.create({
      data: {
        title,
        description,
        category: category || "General",
        location,
        venue: venue || location,
        date: new Date(date),
        time,
        price: parseFloat(price) || 0,
        capacity: parseInt(capacity) || 100,
        imageUrl,
        tags: tags || [],
        organizerId,
        status: "UPCOMING",
      },
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
