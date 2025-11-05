import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

// GET /api/reviews - Get all reviews or reviews for a specific event
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const userId = searchParams.get("userId");

    let query = supabase
      .from("reviews")
      .select("*")
      .order("createdAt", { ascending: false });

    if (eventId) {
      query = query.eq("eventId", eventId);
    }

    if (userId) {
      query = query.eq("userId", userId);
    }

    const { data: reviews, error } = await query;

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === "42P01" || error.message.includes("does not exist")) {
        return NextResponse.json([]);
      }
      throw error;
    }

    return NextResponse.json(reviews || []);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch reviews", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/reviews - Create a new review
export async function POST(request) {
  try {
    const body = await request.json();
    const { eventId, userId, userName, userEmail, rating, reviewText } = body;
    // Validate required fields
    if (!eventId || !userId || !rating) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: eventId, userId, and rating are required",
        },
        { status: 400 }
      );
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Check if user has already reviewed this event
    const { data: existingReview, error: existingError } = await supabase
      .from("reviews")
      .select("id")
      .eq("eventId", eventId)
      .eq("userId", userId)
      .maybeSingle();
    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this event" },
        { status: 409 }
      );
    }

    // Create the review
    const reviewData = {
      id: crypto.randomUUID(), // Generate UUID manually
      eventId: eventId,
      userId: userId,
      rating: parseInt(rating),
      comment: reviewText || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const { data: review, error: insertError } = await supabase
      .from("reviews")
      .insert([reviewData])
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: `Failed to create review: ${insertError.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}

// PUT /api/reviews - Update a review
export async function PUT(request) {
  try {
    const body = await request.json();
    const { reviewId, rating, reviewText } = body;

    if (!reviewId) {
      return NextResponse.json(
        { error: "Review ID is required" },
        { status: 400 }
      );
    }

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const updateData = {
      updatedAt: new Date().toISOString(),
    };

    if (rating) updateData.rating = rating;
    if (reviewText !== undefined) updateData.comment = reviewText;

    const { data: review, error } = await supabase
      .from("reviews")
      .update(updateData)
      .eq("id", reviewId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(review);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}

// DELETE /api/reviews - Delete a review
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get("reviewId");

    if (!reviewId) {
      return NextResponse.json(
        { error: "Review ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
}
