import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Get user and check admin role
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "EVENT_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    let stats = {};
    let recentActivity = [];

    if (user.role === "SUPER_ADMIN") {
      // Super admin sees all stats
      const [totalEvents, totalBookings, totalRevenue, activeEvents] =
        await Promise.all([
          prisma.event.count(),
          prisma.booking.count(),
          prisma.booking.aggregate({
            _sum: { totalAmount: true },
            where: { status: "CONFIRMED" },
          }),
          prisma.event.count({
            where: {
              status: "UPCOMING",
              date: { gte: new Date() },
            },
          }),
        ]);

      stats = {
        totalEvents,
        totalBookings,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        activeEvents,
      };

      // Get recent activity for super admin
      recentActivity = [
        {
          description: "New event created: Tech Conference 2025",
          timestamp: "2 hours ago",
        },
        {
          description: "Admin assigned to Marketing Workshop",
          timestamp: "5 hours ago",
        },
        {
          description: "Discount code applied: SAVE20",
          timestamp: "1 day ago",
        },
      ];
    } else if (user.role === "EVENT_ADMIN") {
      // Event admin sees only their assigned events
      const adminEvents = await prisma.eventAdmin.findMany({
        where: { userId },
        include: {
          event: {
            include: {
              bookings: true,
            },
          },
        },
      });

      const eventIds = adminEvents.map((ea) => ea.event.id);

      const [totalBookings] = await Promise.all([
        prisma.booking.count({
          where: { eventId: { in: eventIds } },
        }),
      ]);

      stats = {
        totalEvents: adminEvents.length,
        totalBookings,
        totalRevenue: 0, // Event admins don't see revenue
        activeEvents: adminEvents.filter((ea) => ea.event.status === "UPCOMING")
          .length,
      };

      // Get recent activity for event admin
      recentActivity = [
        {
          description: "Ticket verified for Tech Conference",
          timestamp: "1 hour ago",
        },
        { description: "New booking received", timestamp: "3 hours ago" },
      ];
    }

    return NextResponse.json({
      stats,
      recentActivity,
      userRole: user.role,
    });
  } catch (error) {
    console.error("Error fetching admin dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
