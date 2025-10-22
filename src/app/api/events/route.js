import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/events - Get all events
export async function GET() {
  try {
    const events = await prisma.event.findMany({
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

// POST /api/events - Create a new event
export async function POST(request) {
  try {
    const body = await request.json();
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
    } = body;

    // Validate required fields
    if (
      !title ||
      !description ||
      !category ||
      !location ||
      !venue ||
      !date ||
      !time ||
      !organizerId
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        category,
        location,
        venue,
        date: new Date(date),
        time,
        price: parseFloat(price) || 0,
        capacity: parseInt(capacity) || 100,
        imageUrl,
        tags: tags || [],
        organizerId,
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
