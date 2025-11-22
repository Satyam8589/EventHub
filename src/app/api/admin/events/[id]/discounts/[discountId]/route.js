import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// PATCH /api/admin/events/[id]/discounts/[discountId] - Update discount status
export async function PATCH(request, { params }) {
  try {
    const { id, discountId } = await params;
    const body = await request.json();
    const { isActive } = body;

    const { data: discount, error } = await supabase
      .from("event_discounts")
      .update({ isActive: isActive })
      .eq("id", discountId)
      .eq("eventId", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(discount);
  } catch (error) {
    console.error("Error updating discount:", error);
    return NextResponse.json(
      { error: "Failed to update discount" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/events/[id]/discounts/[discountId] - Delete discount
export async function DELETE(request, { params }) {
  try {
    const { id, discountId } = await params;
    
    const { error } = await supabase
      .from("event_discounts")
      .delete()
      .eq("id", discountId)
      .eq("eventId", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ message: "Discount deleted successfully" });
  } catch (error) {
    console.error("Error deleting discount:", error);
    return NextResponse.json(
      { error: "Failed to delete discount" },
      { status: 500 }
    );
  }
}
