import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/admin/users/search?q=search_term - Search users for admin assignment
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Search users who are not already event admins and exclude super admins
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query.trim(), mode: "insensitive" } },
              { email: { contains: query.trim(), mode: "insensitive" } },
            ],
          },
          {
            role: {
              in: ["ATTENDEE", "ORGANIZER"], // Only regular users can become event admins
            },
          },
          {
            eventAdminFor: {
              none: {}, // Users who are not already admins of any event
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
      take: 10,
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
    );
  }
}
