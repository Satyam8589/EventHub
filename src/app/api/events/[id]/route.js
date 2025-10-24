import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/events/[id] - Get a specific event
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const { data: event, error } = await supabase
      .from('events')
      .select(`
        *,
        organizer:User!Event_organizerId_fkey (
          id,
          name,
          email,
          phone
        ),
        bookings:Booking (
          *,
          user:User (
            id,
            name,
            email
          )
        )
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

// PUT /api/events/[id] - Update a specific event
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const event = await prisma.event.update({
      where: { id },
      data: {
        ...body,
        price: body.price ? parseFloat(body.price) : undefined,
        capacity: body.capacity ? parseInt(body.capacity) : undefined,
        date: body.date ? new Date(body.date) : undefined,
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

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id] - Delete a specific event
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
