import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/debug/create-test-event - Create a test event for debugging
export async function POST() {
  try {
    console.log("Creating test event...");

    // First, get an existing user to use as organizer
    const { data: existingUsers, error: userError } = await supabase
      .from("users")
      .select("id, name, email")
      .limit(1);

    if (userError || !existingUsers || existingUsers.length === 0) {
      throw new Error(
        "No users found. Cannot create test event without a valid organizer."
      );
    }

    const organizer = existingUsers[0];
    console.log("Using organizer:", organizer);

    const testEventData = {
      id: `test-event-${Date.now()}`,
      title: "Test Event - Price Debugging",
      description: "This is a test event created for debugging price issues.",
      category: "TESTING",
      location: "Test Location",
      venue: "Test Venue",
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      time: "10:00",
      price: 25.5, // Test with a specific price
      capacity: 100,
      imageUrl:
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop&crop=center",
      organizerId: organizer.id, // Use real organizer ID
      organizerName: organizer.name || "Test Organizer",
      organizerEmail: organizer.email || "test@example.com",
      organizerPhone: "1234567890",
      featured: false,
      status: "UPCOMING",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log("Test event data:", testEventData);

    const { data: createdEvent, error: createError } = await supabase
      .from("events")
      .insert([testEventData])
      .select("*")
      .single();

    if (createError) {
      console.error("Error creating test event:", createError);
      throw createError;
    }

    console.log("Test event created successfully:", createdEvent);

    return NextResponse.json({
      success: true,
      message: "Test event created successfully",
      event: createdEvent,
      price_verification: {
        original_price: testEventData.price,
        stored_price: createdEvent.price,
        price_matches: testEventData.price === createdEvent.price,
        price_type: typeof createdEvent.price,
      },
    });
  } catch (error) {
    console.error("Failed to create test event:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: error,
      },
      { status: 500 }
    );
  }
}

// DELETE /api/debug/create-test-event - Clean up test events
export async function DELETE() {
  try {
    console.log("Cleaning up test events...");

    const { data: deletedEvents, error: deleteError } = await supabase
      .from("events")
      .delete()
      .like("title", "%Test Event - Price Debugging%")
      .select("*");

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedEvents?.length || 0} test events`,
      deleted_events: deletedEvents,
    });
  } catch (error) {
    console.error("Failed to clean up test events:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
