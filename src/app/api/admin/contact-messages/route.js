import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/admin/contact-messages - Get all contact messages
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Get user and check admin role
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError || !user || (user.role !== "SUPER_ADMIN" && user.role !== "EVENT_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch contact messages
    const { data: messages, error: messagesError } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (messagesError) {
      throw messagesError;
    }

    return NextResponse.json({
      success: true,
      messages: messages || [],
      total: messages?.length || 0
    });

  } catch (error) {
    console.error("Contact messages fetch error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch contact messages", 
        details: error.message,
        messages: [],
        total: 0
      },
      { status: 500 }
    );
  }
}