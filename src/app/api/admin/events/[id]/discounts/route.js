import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/admin/events/[id]/discounts - Create new discount
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { code, type, value, maxUses, validUntil, isActive } = body;

    // Check if discount code already exists for this event
    const existingDiscount = await prisma.eventDiscount.findFirst({
      where: {
        eventId: id,
        code: code.toUpperCase(),
      },
    });

    if (existingDiscount) {
      return NextResponse.json(
        { error: "Discount code already exists for this event" },
        { status: 400 }
      );
    }

    const discount = await prisma.eventDiscount.create({
      data: {
        eventId: id,
        code: code.toUpperCase(),
        type,
        value: parseFloat(value),
        maxUses: maxUses ? parseInt(maxUses) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(discount, { status: 201 });
  } catch (error) {
    console.error("Error creating discount:", error);
    return NextResponse.json(
      { error: "Failed to create discount" },
      { status: 500 }
    );
  }
}
