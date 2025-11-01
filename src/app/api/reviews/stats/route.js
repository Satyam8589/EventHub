import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/reviews/stats - Get review statistics for events
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (eventId) {
      // Get stats for a specific event
      const { data: reviews, error } = await supabase
        .from("reviews")
        .select("rating")
        .eq("eventId", eventId);

      if (error) {
        console.error("Error fetching reviews for stats:", error);
        // If table doesn't exist, return empty stats
        if (
          error.code === "42P01" ||
          error.message.includes("does not exist")
        ) {
          console.warn(
            "reviews table does not exist. Please run the migration."
          );
          return NextResponse.json({
            eventId,
            totalReviews: 0,
            averageRating: 0,
            ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          });
        }
        throw error;
      }

      const totalReviews = reviews.length;
      const averageRating =
        totalReviews > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
          : 0;

      const ratingDistribution = {
        5: reviews.filter((r) => r.rating === 5).length,
        4: reviews.filter((r) => r.rating === 4).length,
        3: reviews.filter((r) => r.rating === 3).length,
        2: reviews.filter((r) => r.rating === 2).length,
        1: reviews.filter((r) => r.rating === 1).length,
      };

      return NextResponse.json({
        eventId,
        totalReviews,
        averageRating: parseFloat(averageRating.toFixed(2)),
        ratingDistribution,
      });
    } else {
      // Get stats for all events
      const { data: allReviews, error } = await supabase
        .from("reviews")
        .select("eventId, rating");

      if (error) {
        console.error("Error fetching all reviews for stats:", error);
        // If table doesn't exist, return empty array
        if (
          error.code === "42P01" ||
          error.message.includes("does not exist")
        ) {
          console.warn(
            "reviews table does not exist. Please run the migration."
          );
          return NextResponse.json([]);
        }
        throw error;
      }

      // Group by eventId
      const eventStats = {};
      allReviews.forEach((review) => {
        if (!eventStats[review.eventId]) {
          eventStats[review.eventId] = {
            ratings: [],
            totalReviews: 0,
          };
        }
        eventStats[review.eventId].ratings.push(review.rating);
        eventStats[review.eventId].totalReviews++;
      });

      // Calculate average for each event
      const stats = Object.entries(eventStats).map(([eventId, data]) => ({
        eventId,
        totalReviews: data.totalReviews,
        averageRating: parseFloat(
          (
            data.ratings.reduce((sum, r) => sum + r, 0) / data.totalReviews
          ).toFixed(2)
        ),
      }));

      return NextResponse.json(stats);
    }
  } catch (error) {
    console.error("Error fetching review stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch review statistics" },
      { status: 500 }
    );
  }
}
