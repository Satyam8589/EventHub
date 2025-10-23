// Quick script to check what bookings exist in the database
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkBookings() {
  try {
    console.log("=== CHECKING BOOKINGS IN DATABASE ===\n");

    // Get all bookings
    const bookings = await prisma.booking.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            title: true,
          },
        },
        verifications: true,
      },
    });

    console.log(`Found ${bookings.length} bookings:\n`);

    bookings.forEach((booking, index) => {
      console.log(`${index + 1}. Booking ID: ${booking.id}`);
      console.log(`   Status: ${booking.status}`);
      console.log(`   Event: ${booking.event.title}`);
      console.log(`   User: ${booking.user.name} (${booking.user.email})`);
      console.log(`   Tickets: ${booking.tickets}`);
      console.log(
        `   Verified: ${booking.verifications.length > 0 ? "YES" : "NO"}`
      );
      console.log(`   Created: ${booking.createdAt}`);
      console.log("");
    });

    // Check EventAdmins
    console.log("\n=== EVENT ADMINS ===\n");
    const admins = await prisma.eventAdmin.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    admins.forEach((admin) => {
      console.log(`Admin: ${admin.user.name} (${admin.user.email})`);
      console.log(`  User ID: ${admin.userId}`);
      console.log(`  Event: ${admin.event.title}`);
      console.log(`  Event ID: ${admin.eventId}`);
      console.log("");
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBookings();
