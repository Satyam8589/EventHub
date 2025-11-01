import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Test endpoint to verify reviews table
export async function GET() {
  try {
    console.log("Testing reviews table...");

    // Try to read from reviews table
    const { data: reviews, error: readError } = await supabase
      .from("reviews")
      .select("*")
      .limit(5);

    console.log("Read test:", { reviews, readError });

    // Try to insert a test review
    const testReview = {
      eventId: "test-event-id",
      userId: "test-user-id",
      rating: 5,
      comment: "Test review",
    };

    const { data: insertData, error: insertError } = await supabase
      .from("reviews")
      .insert([testReview])
      .select()
      .single();

    console.log("Insert test:", { insertData, insertError });

    // Delete the test review
    if (insertData?.id) {
      await supabase.from("reviews").delete().eq("id", insertData.id);
    }

    return NextResponse.json({
      success: true,
      readTest: {
        success: !readError,
        error: readError?.message,
        count: reviews?.length || 0,
      },
      insertTest: {
        success: !insertError,
        error: insertError?.message,
        data: insertData,
      },
    });
  } catch (error) {
    console.error("Test error:", error);
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}
