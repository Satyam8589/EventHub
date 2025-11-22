import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create service role client to bypass RLS for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// POST /api/admin/events/[id]/discounts - Create new discount
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    console.log("=== DISCOUNT CREATION DEBUG ===");
    console.log("Event ID:", id);
    console.log("Request body:", body);

    const { code, type, value, maxUses, validUntil, isActive } = body;

    // Validate required fields
    if (!code || !type || !value) {
      console.error("Missing required fields:", { code, type, value });
      return NextResponse.json(
        { error: "Missing required fields: code, type, and value are required" },
        { status: 400 }
      );
    }

    // Check if discount code already exists for this event
    const { data: existingDiscount, error: checkError } = await supabaseAdmin
      .from("event_discounts")
      .select("*")
      .eq("eventId", id)
      .eq("code", code.toUpperCase())
      .single();

    console.log("Existing discount check:", { existingDiscount, checkError });

    if (existingDiscount) {
      return NextResponse.json(
        { error: "Discount code already exists for this event" },
        { status: 400 }
      );
    }

    // Convert validUntil to IST if provided
    let validUntilIST = null;
    if (validUntil) {
      // The frontend sends datetime-local format (e.g., "2025-12-31T23:59")
      // We need to treat this as IST and convert to ISO format with IST offset
      const dateObj = new Date(validUntil);
      
      // Format as IST ISO string (YYYY-MM-DDTHH:MM:SS+05:30)
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      const seconds = String(dateObj.getSeconds()).padStart(2, '0');
      
      validUntilIST = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+05:30`;
      console.log("Valid until (IST):", validUntilIST);
    }

    // Prepare discount data
    const discountData = {
      eventId: id,
      code: code.toUpperCase(),
      type,
      value: parseFloat(value),
      maxUses: maxUses ? parseInt(maxUses) : null,
      validUntil: validUntilIST,
      isActive: isActive ?? true,
    };

    console.log("Discount data to insert:", discountData);

    // Create new discount using service role client (bypasses RLS)
    const { data: discount, error: createError } = await supabaseAdmin
      .from("event_discounts")
      .insert([discountData])
      .select()
      .single();

    if (createError) {
      console.error("Supabase insert error:", createError);
      console.error("Error details:", JSON.stringify(createError, null, 2));
      throw createError;
    }

    console.log("Discount created successfully:", discount);
    return NextResponse.json(discount, { status: 201 });
  } catch (error) {
    console.error("=== DISCOUNT CREATION ERROR ===");
    console.error("Error message:", error.message);
    console.error("Error details:", error);
    console.error("Error stack:", error.stack);
    
    return NextResponse.json(
      { 
        error: "Failed to create discount",
        details: error.message,
        hint: error.hint || "Check server logs for more details"
      },
      { status: 500 }
    );
  }
}
