import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/events/[id]/validate-discount - Validate and apply discount code
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { code } = body;

    if (!code || !code.trim()) {
      return NextResponse.json(
        { error: "Discount code is required" },
        { status: 400 }
      );
    }

    // Find the discount code for this event
    const { data: discount, error: discountError } = await supabase
      .from("event_discounts")
      .select("*")
      .eq("eventId", id)
      .eq("code", code.toUpperCase())
      .eq("isActive", true)
      .single();

    if (discountError || !discount) {
      return NextResponse.json(
        { error: "Invalid discount code" },
        { status: 404 }
      );
    }

    // Check if discount has expired (compare in IST)
    if (discount.validUntil) {
      // Get current time in IST
      const now = new Date();
      const nowIST = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      
      // Parse the stored validUntil (which is in IST format)
      const validUntil = new Date(discount.validUntil);
      
      console.log("Expiry check:", {
        nowIST: nowIST.toISOString(),
        validUntil: validUntil.toISOString(),
        expired: nowIST > validUntil
      });
      
      if (nowIST > validUntil) {
        return NextResponse.json(
          { error: "This discount code has expired" },
          { status: 400 }
        );
      }
    }

    // Check if discount has reached max uses
    if (discount.maxUses && discount.currentUses >= discount.maxUses) {
      return NextResponse.json(
        { error: "This discount code has reached its maximum usage limit" },
        { status: 400 }
      );
    }

    // Return the valid discount
    return NextResponse.json({
      success: true,
      discount: {
        id: discount.id,
        code: discount.code,
        type: discount.type,
        value: discount.value,
      },
    });
  } catch (error) {
    console.error("Error validating discount:", error);
    return NextResponse.json(
      { error: "Failed to validate discount code" },
      { status: 500 }
    );
  }
}
