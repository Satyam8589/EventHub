import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Test endpoint to check database tables and structure
export async function GET() {
  try {
    console.log("Testing Supabase connection and tables...");

    // Try to get all table names
    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public");

    if (tablesError) {
      console.error("Error getting tables:", tablesError);
    } else {
      console.log(
        "Available tables:",
        tables?.map((t) => t.table_name)
      );
    }

    // Try to get users table structure
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("*")
      .limit(1);

    if (usersError) {
      console.error("Users table error:", usersError);
      return NextResponse.json({
        error: "Users table error",
        details: usersError,
        availableTables:
          tables?.map((t) => t.table_name) || "Could not fetch tables",
      });
    } else {
      console.log("Users table accessible, sample:", users);
      return NextResponse.json({
        success: true,
        usersCount: users?.length || 0,
        availableTables:
          tables?.map((t) => t.table_name) || "Could not fetch tables",
      });
    }
  } catch (error) {
    console.error("Database test error:", error);
    return NextResponse.json({
      error: "Database test failed",
      details: error.message,
    });
  }
}
