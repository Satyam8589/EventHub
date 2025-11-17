import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request, { params }) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
  }

  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw error;
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch user", details: error.message },
      { status: 500 }
    );
  }
}
