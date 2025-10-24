import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 }
      );
    }

    const { data: users, error } = await supabase
      .from("users")
      .select("id, name, email, role, avatar")
      .or(`name.ilike.%${query.trim()}%,email.ilike.%${query.trim()}%`)
      .in("role", ["ATTENDEE", "ORGANIZER", "EVENT_ADMIN"])
      .order("name", { ascending: true })
      .limit(10);

    if (error) {
      console.error("Error searching users:", error);
      return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }

    return NextResponse.json({ users: users || [] });
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
    );
  }
}
