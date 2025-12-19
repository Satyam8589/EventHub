import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

// GET /api/admin/events/[id]/download-participants - Download event participants as Excel
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    // Fetch event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Fetch all bookings for this event with user details
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select(
        `
        *,
        user:users(*)
      `
      )
      .eq("eventId", id)
      .order("createdAt", { ascending: false });

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError);
      return NextResponse.json(
        { error: "Failed to fetch bookings" },
        { status: 500 }
      );
    }

    // Filter out PENDING bookings - only include CONFIRMED bookings in Excel
    const confirmedBookings = bookings.filter((b) => b.status === "CONFIRMED");

    // Check if event has custom field or discounts enabled
    const hasCustomField = event.show_custom_field === true;
    const hasDiscounts = confirmedBookings.some((b) => b.discountAmount > 0);

    // Format data for Excel
    const excelData = confirmedBookings.map((booking, index) => {
      const user = booking.user || {};
      const row = {
        "Sr. No.": index + 1,
        "Booking ID": booking.id || "N/A",
        "User Name": user.name || "N/A",
        Email: user.email || "N/A",
        Phone: user.phone || "N/A",
        "Number of Tickets": booking.tickets || 0,
        "Total Amount (₹)": booking.totalAmount || 0,
      };

      // Only add discount column if event has discounts
      if (hasDiscounts) {
        row["Discount Applied (₹)"] = booking.discountAmount || 0;
      }

      row["Amount Paid (₹)"] =
        (booking.totalAmount || 0) - (booking.discountAmount || 0);
      row["Status"] = booking.status || "N/A";
      row["Payment Method"] = booking.paymentMethod || "N/A";

      // Payment ID - all bookings in Excel are confirmed, so show payment ID
      row["Payment ID"] = booking.paymentId || "N/A";

      // Only add custom field column if event has custom field enabled
      if (hasCustomField) {
        row[event.custom_field_label || "Custom Field Response"] =
          booking.custom_field_response || "N/A";
      }

      row["Booking Date"] = booking.createdAt
        ? new Date(booking.createdAt).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          })
        : "N/A";

      return row;
    });

    // Add summary row - now using only confirmed bookings
    const totalParticipants = confirmedBookings.length;
    const totalTickets = confirmedBookings.reduce(
      (sum, b) => sum + (b.tickets || 0),
      0
    );
    const totalRevenue = confirmedBookings.reduce(
      (sum, b) => sum + ((b.totalAmount || 0) - (b.discountAmount || 0)),
      0
    );
    const totalConfirmedBookings = confirmedBookings.length;

    // Create empty row
    const emptyRow = {
      "Sr. No.": "",
      "Booking ID": "",
      "User Name": "",
      Email: "",
      Phone: "",
      "Number of Tickets": "",
      "Total Amount (₹)": "",
    };
    if (hasDiscounts) emptyRow["Discount Applied (₹)"] = "";
    emptyRow["Amount Paid (₹)"] = "";
    emptyRow["Status"] = "";
    emptyRow["Payment Method"] = "";
    emptyRow["Payment ID"] = "";
    if (hasCustomField)
      emptyRow[event.custom_field_label || "Custom Field Response"] = "";
    emptyRow["Booking Date"] = "";

    excelData.push(emptyRow);

    // Create summary row
    const summaryRow = {
      "Sr. No.": "SUMMARY",
      "Booking ID": "",
      "User Name": `Total Participants: ${totalParticipants}`,
      Email: "",
      Phone: "",
      "Number of Tickets": `Total Tickets: ${totalTickets}`,
      "Total Amount (₹)": "",
    };
    if (hasDiscounts) summaryRow["Discount Applied (₹)"] = "";
    summaryRow["Amount Paid (₹)"] = `Total Revenue: ₹${totalRevenue}`;
    summaryRow["Status"] = `Confirmed: ${totalConfirmedBookings}`;
    summaryRow["Payment Method"] = "";
    summaryRow["Payment ID"] = "";
    if (hasCustomField)
      summaryRow[event.custom_field_label || "Custom Field Response"] = "";
    summaryRow["Booking Date"] = "";

    excelData.push(summaryRow);

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths dynamically based on columns present
    const colWidths = [
      { wch: 8 }, // Sr. No.
      { wch: 30 }, // Booking ID
      { wch: 20 }, // User Name
      { wch: 25 }, // Email
      { wch: 15 }, // Phone
      { wch: 15 }, // Tickets
      { wch: 15 }, // Total Amount
    ];
    if (hasDiscounts) colWidths.push({ wch: 18 }); // Discount
    colWidths.push({ wch: 15 }); // Amount Paid
    colWidths.push({ wch: 12 }); // Status
    colWidths.push({ wch: 15 }); // Payment Method
    colWidths.push({ wch: 30 }); // Payment ID
    if (hasCustomField) colWidths.push({ wch: 25 }); // Custom Field
    colWidths.push({ wch: 20 }); // Booking Date

    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Participants");

    // Add event info sheet
    const eventInfo = [
      { Field: "Event Name", Value: event.title },
      {
        Field: "Event Date",
        Value: new Date(event.date).toLocaleDateString("en-IN", {
          timeZone: "Asia/Kolkata",
        }),
      },
      { Field: "Event Time", Value: event.time },
      { Field: "Location", Value: event.location },
      { Field: "Venue", Value: event.venue },
      { Field: "Category", Value: event.category },
      { Field: "Capacity", Value: event.capacity },
      { Field: "Price", Value: `₹${event.price}` },
      { Field: "Total Bookings", Value: totalParticipants },
      { Field: "Total Tickets Sold", Value: totalTickets },
      { Field: "Total Revenue", Value: `₹${totalRevenue}` },
      { Field: "Confirmed Bookings", Value: totalConfirmedBookings },
      {
        Field: "Report Generated",
        Value: new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        }),
      },
    ];

    const wsInfo = XLSX.utils.json_to_sheet(eventInfo);
    wsInfo["!cols"] = [{ wch: 25 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsInfo, "Event Info");

    // Generate buffer
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    // Create filename with event name and date
    const fileName = `${event.title.replace(
      /[^a-zA-Z0-9]/g,
      "_"
    )}_Participants_${new Date().toISOString().split("T")[0]}.xlsx`;

    // Return Excel file
    return new NextResponse(buf, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Error generating Excel:", error);
    return NextResponse.json(
      { error: "Failed to generate Excel file", details: error.message },
      { status: 500 }
    );
  }
}
