import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/auth/sync-user - Sync Firebase user with our database
export async function POST(request) {
  try {
    const { uid, email, name, avatar } = await request.json();

    if (!uid || !email) {
      return NextResponse.json(
        { error: "UID and email are required" },
        { status: 400 }
      );
    }

    // Check if user already exists in our database
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ id: uid }, { email: email }],
      },
    });

    if (user) {
      // Update existing user (preserve existing role)
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: name || user.name,
          avatar: avatar || user.avatar,
          // Don't update role here - preserve existing role from database
        },
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          id: uid, // Use Firebase UID as our database ID
          email,
          name: name || email.split("@")[0],
          avatar,
          role: "ATTENDEE",
        },
      });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error syncing user:", error);
    return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
  }
}
