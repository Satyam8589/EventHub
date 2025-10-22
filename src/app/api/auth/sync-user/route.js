import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/auth/sync-user - Sync Firebase user with our database
export async function POST(request) {
  try {
    console.log("Starting POST /api/auth/sync-user");
    console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
    
    const { uid, email, name, avatar } = await request.json();

    if (!uid || !email) {
      return NextResponse.json(
        { error: "UID and email are required" },
        { status: 400 }
      );
    }

    console.log("Syncing user:", uid, email);

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
      console.log("Updated existing user");
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
      console.log("Created new user");
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error syncing user:", error.message);
    console.error("Error code:", error.code);
    console.error("Error details:", error);
    return NextResponse.json({ error: "Failed to sync user", details: error.message }, { status: 500 });
  }
}
