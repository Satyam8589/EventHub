import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Create Super Admin user
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@eventhub.com" },
    update: {
      role: "SUPER_ADMIN",
    },
    create: {
      id: "super-admin-001",
      email: "admin@eventhub.com",
      name: "Super Admin",
      role: "SUPER_ADMIN",
    },
  });

  console.log("✅ Created Super Admin:", superAdmin.email);

  // Create Event Admin user
  const eventAdmin = await prisma.user.upsert({
    where: { email: "eventadmin@eventhub.com" },
    update: {
      role: "EVENT_ADMIN",
    },
    create: {
      id: "event-admin-001",
      email: "eventadmin@eventhub.com",
      name: "Event Admin",
      role: "EVENT_ADMIN",
    },
  });

  console.log("✅ Created Event Admin:", eventAdmin.email);

  // Create users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "john.doe@example.com" },
      update: {},
      create: {
        name: "John Doe",
        email: "john.doe@example.com",
        phone: "+1-555-0123",
        role: "ORGANIZER",
      },
    }),
    prisma.user.upsert({
      where: { email: "jane.smith@example.com" },
      update: {},
      create: {
        name: "Jane Smith",
        email: "jane.smith@example.com",
        phone: "+1-555-0124",
        role: "ORGANIZER",
      },
    }),
    prisma.user.upsert({
      where: { email: "alice.johnson@example.com" },
      update: {},
      create: {
        name: "Alice Johnson",
        email: "alice.johnson@example.com",
        phone: "+1-555-0125",
        role: "ATTENDEE",
      },
    }),
    prisma.user.upsert({
      where: { email: "bob.wilson@example.com" },
      update: {},
      create: {
        name: "Bob Wilson",
        email: "bob.wilson@example.com",
        phone: "+1-555-0126",
        role: "ATTENDEE",
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create events
  const events = [
    {
      title: "Tech Conference 2024",
      description:
        "Annual technology conference featuring the latest innovations in AI, blockchain, and web development.",
      category: "Technology",
      location: "San Francisco",
      venue: "Moscone Convention Center",
      date: new Date("2024-03-15T09:00:00Z"),
      time: "09:00 AM",
      price: 299.99,
      capacity: 500,
      imageUrl: "/images/tech-conference.jpg",
      tags: ["Technology", "AI", "Blockchain", "Web Development"],
      organizerId: users[0].id,
    },
    {
      title: "Music Festival Summer 2024",
      description:
        "Three-day outdoor music festival featuring top artists from around the world.",
      category: "Music",
      location: "Austin",
      venue: "Zilker Park",
      date: new Date("2024-06-20T18:00:00Z"),
      time: "06:00 PM",
      price: 150.0,
      capacity: 10000,
      imageUrl: "/images/music-festival.jpg",
      tags: ["Music", "Festival", "Outdoor", "Live"],
      organizerId: users[1].id,
    },
    {
      title: "Startup Pitch Competition",
      description:
        "Emerging startups present their innovative ideas to a panel of expert investors.",
      category: "Business",
      location: "New York",
      venue: "WeWork Times Square",
      date: new Date("2024-04-10T14:00:00Z"),
      time: "02:00 PM",
      price: 50.0,
      capacity: 200,
      imageUrl: "/images/startup-pitch.jpg",
      tags: ["Business", "Startup", "Investment", "Innovation"],
      organizerId: users[0].id,
    },
    {
      title: "Food & Wine Expo",
      description:
        "Taste exceptional cuisine and wines from renowned chefs and sommeliers.",
      category: "Food & Drink",
      location: "Napa Valley",
      venue: "Napa Convention Center",
      date: new Date("2024-05-25T12:00:00Z"),
      time: "12:00 PM",
      price: 85.0,
      capacity: 300,
      imageUrl: "/images/food-wine-expo.jpg",
      tags: ["Food", "Wine", "Culinary", "Tasting"],
      organizerId: users[1].id,
    },
    {
      title: "Art Gallery Opening",
      description:
        "Exclusive opening of contemporary art exhibition featuring local and international artists.",
      category: "Art & Culture",
      location: "Los Angeles",
      venue: "MOCA Grand Avenue",
      date: new Date("2024-03-30T19:00:00Z"),
      time: "07:00 PM",
      price: 25.0,
      capacity: 150,
      imageUrl: "/images/art-gallery.jpg",
      tags: ["Art", "Culture", "Exhibition", "Contemporary"],
      organizerId: users[0].id,
    },
    {
      title: "Marathon 2024",
      description:
        "26.2 mile race through the city with scenic routes and enthusiastic crowd support.",
      category: "Sports",
      location: "Boston",
      venue: "Boston Common Start Line",
      date: new Date("2024-04-21T08:00:00Z"),
      time: "08:00 AM",
      price: 75.0,
      capacity: 30000,
      imageUrl: "/images/marathon.jpg",
      tags: ["Sports", "Running", "Marathon", "Fitness"],
      organizerId: users[1].id,
    },
  ];

  const createdEvents = [];
  for (const eventData of events) {
    const event = await prisma.event.create({
      data: eventData,
    });
    createdEvents.push(event);
  }

  console.log(`✅ Created ${createdEvents.length} events`);

  // Create some sample bookings
  const bookings = [
    {
      userId: users[2].id, // Alice
      eventId: createdEvents[0].id, // Tech Conference
      tickets: 1,
      totalAmount: 299.99,
      status: "CONFIRMED",
    },
    {
      userId: users[3].id, // Bob
      eventId: createdEvents[1].id, // Music Festival
      tickets: 2,
      totalAmount: 300.0,
      status: "CONFIRMED",
    },
    {
      userId: users[2].id, // Alice
      eventId: createdEvents[4].id, // Art Gallery
      tickets: 1,
      totalAmount: 25.0,
      status: "CONFIRMED",
    },
  ];

  const createdBookings = [];
  for (const bookingData of bookings) {
    const booking = await prisma.booking.create({
      data: bookingData,
    });
    createdBookings.push(booking);
  }

  console.log(`✅ Created ${createdBookings.length} bookings`);

  // Create some sample reviews
  const reviews = [
    {
      userId: users[2].id, // Alice
      eventId: createdEvents[0].id, // Tech Conference
      rating: 5,
      comment:
        "Amazing conference! Learned so much about AI and blockchain technologies.",
    },
    {
      userId: users[3].id, // Bob
      eventId: createdEvents[1].id, // Music Festival
      rating: 4,
      comment:
        "Great lineup and atmosphere. The sound quality could have been better.",
    },
  ];

  const createdReviews = [];
  for (const reviewData of reviews) {
    const review = await prisma.review.create({
      data: reviewData,
    });
    createdReviews.push(review);
  }

  console.log(`✅ Created ${createdReviews.length} reviews`);

  // Assign event admin to some events
  if (createdEvents.length > 0) {
    const assignment = await prisma.eventAdmin.upsert({
      where: {
        userId_eventId: {
          userId: eventAdmin.id,
          eventId: createdEvents[0].id,
        },
      },
      update: {},
      create: {
        userId: eventAdmin.id,
        eventId: createdEvents[0].id,
      },
    });

    console.log("✅ Assigned Event Admin to first event");
  }

  console.log("🎉 Database seeding completed successfully!");
  console.log("\n📋 Admin Credentials:");
  console.log("Super Admin: admin@eventhub.com");
  console.log("Event Admin: eventadmin@eventhub.com");
  console.log(
    "\n🔐 Note: Create these users in Firebase Authentication with any password"
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error during seeding:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
