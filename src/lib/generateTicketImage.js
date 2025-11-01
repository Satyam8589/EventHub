import { createCanvas, loadImage } from "canvas";

// Helper function to calculate event duration in days
function calculateEventDays(event) {
  console.log("🔍 Calculating event days for:", {
    eventId: event.id,
    date: event.date,
    endDate: event.endDate,
    enddate: event.enddate,
    eventKeys: Object.keys(event),
  });

  const startDate = new Date(event.date);
  const endDate =
    event.endDate || event.enddate
      ? new Date(event.endDate || event.enddate)
      : null;

  console.log("📅 Date calculation:", {
    startDate: startDate.toISOString(),
    endDate: endDate ? endDate.toISOString() : null,
    hasEndDate: !!endDate,
  });

  if (!endDate) {
    console.log("❌ No end date found, returning 1 day");
    return 1; // Single day event
  }

  // Calculate difference in days
  const timeDiff = endDate.getTime() - startDate.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end days

  const finalDays = Math.max(1, daysDiff);
  console.log("✅ Event duration calculated:", {
    timeDiff,
    daysDiff,
    finalDays,
  });

  return finalDays; // Ensure at least 1 day
}

// Helper function to generate day-specific QR data
function generateDayQRData(booking, dayIndex, totalDays) {
  return `${booking.id}_DAY_${dayIndex + 1}_OF_${totalDays}`;
}

// Helper function to check if a QR code is scanned
function isQRScanned(booking, dayNumber, qrData) {
  if (!booking.scannedQRs) return false;

  try {
    const scannedQRs = JSON.parse(booking.scannedQRs);
    return scannedQRs.some(
      (scanned) => scanned.dayNumber === dayNumber && scanned.qrData === qrData
    );
  } catch (e) {
    console.warn("Could not parse scannedQRs:", e);
    return false;
  }
}

// Helper function to get scan info for a QR code
function getQRScanInfo(booking, dayNumber, qrData) {
  if (!booking.scannedQRs) return null;

  try {
    const scannedQRs = JSON.parse(booking.scannedQRs);
    return scannedQRs.find(
      (scanned) => scanned.dayNumber === dayNumber && scanned.qrData === qrData
    );
  } catch (e) {
    console.warn("Could not parse scannedQRs:", e);
    return null;
  }
}
export async function generateTicketImage(booking, event, user) {
  try {
    console.log("🎫 Generating ticket with user data:", {
      userId: user?.id,
      userName: user?.name,
      userEmail: user?.email,
      userPhone: user?.phone,
    });

    // Calculate event days to determine canvas height
    const eventDays = calculateEventDays(event);
    console.log("📏 Event days calculated for canvas sizing:", eventDays);

    // Calculate dynamic height based on content
    let canvasHeight = 800; // Base height

    // Add height for event image
    canvasHeight += 250;

    // Add height for ticket info section
    canvasHeight += 400;

    // Add height for QR code section based on number of days
    if (eventDays === 1) {
      // Single QR code
      canvasHeight += 400; // QR + spacing
    } else {
      // Multiple QR codes in grid
      const qrSize = eventDays <= 3 ? 200 : 150;
      const qrPerRow = Math.min(3, eventDays);
      const totalRows = Math.ceil(eventDays / qrPerRow);
      canvasHeight += 120; // Title and spacing
      canvasHeight += totalRows * (qrSize + 80) + 60; // QR grid + extra spacing
    }

    // Add extra padding for footer
    canvasHeight += 200;

    // For scanned tickets, use minimum height
    if (booking.paymentId && booking.paymentId.startsWith("SCANNED_")) {
      canvasHeight = Math.min(canvasHeight, 1200);
    }

    console.log(
      "📐 Canvas height calculated:",
      canvasHeight,
      "for",
      eventDays,
      "days"
    );

    // Create canvas with dynamic dimensions
    const canvas = createCanvas(900, canvasHeight);
    const ctx = canvas.getContext("2d");

    // Modern gradient background - using dynamic height
    const bgGradient = ctx.createLinearGradient(0, 0, 900, canvasHeight);
    bgGradient.addColorStop(0, "#0f172a"); // slate-950
    bgGradient.addColorStop(0.5, "#1e293b"); // slate-800
    bgGradient.addColorStop(1, "#334155"); // slate-700
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 900, canvasHeight);

    // Load and draw event image at the top
    let yPosition = 0;
    if (event.imageUrl) {
      try {
        const eventImage = await loadImage(event.imageUrl);

        // Draw event image with overlay
        ctx.save();
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, 900, 250);

        // Calculate image dimensions to cover area while maintaining aspect ratio
        const targetWidth = 900;
        const targetHeight = 250;
        const imgRatio = eventImage.width / eventImage.height;
        const targetRatio = targetWidth / targetHeight;

        let drawWidth, drawHeight, offsetX, offsetY;
        if (imgRatio > targetRatio) {
          drawHeight = targetHeight;
          drawWidth = eventImage.width * (targetHeight / eventImage.height);
          offsetX = (targetWidth - drawWidth) / 2;
          offsetY = 0;
        } else {
          drawWidth = targetWidth;
          drawHeight = eventImage.height * (targetWidth / eventImage.width);
          offsetX = 0;
          offsetY = (targetHeight - drawHeight) / 2;
        }

        ctx.drawImage(eventImage, offsetX, offsetY, drawWidth, drawHeight);

        // Add gradient overlay for better text visibility
        const overlayGradient = ctx.createLinearGradient(0, 0, 0, 250);
        overlayGradient.addColorStop(0, "rgba(0, 0, 0, 0.3)");
        overlayGradient.addColorStop(1, "rgba(0, 0, 0, 0.8)");
        ctx.fillStyle = overlayGradient;
        ctx.fillRect(0, 0, 900, 250);

        ctx.restore();
        yPosition = 250;
      } catch (error) {
        console.error("Error loading event image:", error);
        // Fallback gradient header if image fails
        const fallbackGradient = ctx.createLinearGradient(0, 0, 0, 250);
        fallbackGradient.addColorStop(0, "#1e293b");
        fallbackGradient.addColorStop(1, "#0f172a");
        ctx.fillStyle = fallbackGradient;
        ctx.fillRect(0, 0, 900, 250);
        yPosition = 250;
      }
    } else {
      // Fallback gradient header if no image
      const headerGradient = ctx.createLinearGradient(0, 0, 0, 250);
      headerGradient.addColorStop(0, "#1e293b");
      headerGradient.addColorStop(1, "#0f172a");
      ctx.fillStyle = headerGradient;
      ctx.fillRect(0, 0, 900, 250);
      yPosition = 250;
    }

    // Decorative top accent with dual colors
    const topGradient = ctx.createLinearGradient(0, 0, 900, 0);
    topGradient.addColorStop(0, "#3b82f6"); // blue-600
    topGradient.addColorStop(0.5, "#6366f1"); // indigo-500
    topGradient.addColorStop(1, "#8b5cf6"); // violet-500
    ctx.fillStyle = topGradient;
    ctx.fillRect(0, 0, 900, 8);

    // Modern card effect overlay on image area
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.fillRect(40, 40, 820, 170);

    // Subtle border for card
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 40, 820, 170);

    // EventHub Logo with modern styling
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 48px Arial";
    ctx.fillText("EventHub", 60, 100);

    // Stylish badge for E-Ticket
    ctx.fillStyle = "rgba(59, 130, 246, 0.3)";
    ctx.fillRect(60, 125, 120, 35);
    ctx.fillStyle = "#60a5fa";
    ctx.font = "bold 16px Arial";
    ctx.fillText("E-TICKET", 75, 148);

    // Add decorative corner accent
    ctx.fillStyle = "#3b82f6";
    ctx.beginPath();
    ctx.moveTo(820, 40);
    ctx.lineTo(860, 40);
    ctx.lineTo(860, 80);
    ctx.closePath();
    ctx.fill();

    // Ticket ID in modern style
    yPosition = yPosition + 20;
    ctx.fillStyle = "rgba(59, 130, 246, 0.15)";
    ctx.fillRect(60, yPosition, 780, 50);

    ctx.fillStyle = "#60a5fa";
    ctx.font = "bold 14px Arial";
    ctx.fillText("TICKET ID", 80, yPosition + 20);

    ctx.fillStyle = "#ffffff";
    ctx.font = "16px monospace";
    ctx.fillText(booking.id.slice(-12).toUpperCase(), 80, yPosition + 40);

    // Stylish separator
    yPosition += 80;
    const separatorGradient = ctx.createLinearGradient(
      60,
      yPosition,
      840,
      yPosition
    );
    separatorGradient.addColorStop(0, "rgba(59, 130, 246, 0)");
    separatorGradient.addColorStop(0.5, "rgba(59, 130, 246, 0.5)");
    separatorGradient.addColorStop(1, "rgba(59, 130, 246, 0)");
    ctx.fillStyle = separatorGradient;
    ctx.fillRect(60, yPosition, 780, 2);

    // Event Title Section with modern styling
    yPosition += 50;
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 38px Arial";
    const eventTitle = event.title;
    // Wrap text if too long
    const maxWidth = 780;
    if (ctx.measureText(eventTitle).width > maxWidth) {
      const words = eventTitle.split(" ");
      let line = "";
      for (let word of words) {
        const testLine = line + word + " ";
        if (ctx.measureText(testLine).width > maxWidth) {
          ctx.fillText(line, 60, yPosition);
          line = word + " ";
          yPosition += 45;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 60, yPosition);
    } else {
      ctx.fillText(eventTitle, 60, yPosition);
    }

    // Modern info cards section
    yPosition += 70;

    // Date & Time Card
    ctx.fillStyle = "rgba(99, 102, 241, 0.1)"; // indigo tint
    ctx.fillRect(60, yPosition, 370, 120);
    ctx.strokeStyle = "rgba(99, 102, 241, 0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(60, yPosition, 370, 120);

    ctx.fillStyle = "#818cf8"; // indigo-400
    ctx.font = "bold 16px Arial";
    ctx.fillText("📅 DATE & TIME", 80, yPosition + 30);

    ctx.fillStyle = "#f1f5f9"; // slate-100
    ctx.font = "16px Arial";
    const eventDate = new Date(event.date).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    ctx.fillText(eventDate, 80, yPosition + 60);
    if (event.time) {
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "15px Arial";
      ctx.fillText(`⏰ ${event.time}`, 80, yPosition + 85);
    }

    // Location Card
    ctx.fillStyle = "rgba(139, 92, 246, 0.1)"; // violet tint
    ctx.fillRect(470, yPosition, 370, 120);
    ctx.strokeStyle = "rgba(139, 92, 246, 0.3)";
    ctx.strokeRect(470, yPosition, 370, 120);

    ctx.fillStyle = "#a78bfa"; // violet-400
    ctx.font = "bold 16px Arial";
    ctx.fillText("📍 LOCATION", 490, yPosition + 30);

    ctx.fillStyle = "#f1f5f9";
    ctx.font = "15px Arial";
    const location = event.location || "Venue TBA";
    // Wrap location if too long
    if (ctx.measureText(location).width > 330) {
      const words = location.split(" ");
      let line = "";
      let lineY = yPosition + 60;
      for (let word of words) {
        const testLine = line + word + " ";
        if (ctx.measureText(testLine).width > 330) {
          ctx.fillText(line, 490, lineY);
          line = word + " ";
          lineY += 25;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 490, lineY);
    } else {
      ctx.fillText(location, 490, yPosition + 60);
    }

    yPosition += 150;

    // Organizer Information Card
    ctx.fillStyle = "rgba(139, 92, 246, 0.1)"; // violet tint
    ctx.fillRect(60, yPosition, 780, 80);
    ctx.strokeStyle = "rgba(139, 92, 246, 0.3)";
    ctx.strokeRect(60, yPosition, 780, 80);

    ctx.fillStyle = "#a78bfa"; // violet-400
    ctx.font = "bold 16px Arial";
    ctx.fillText("🎭 ORGANIZED BY", 80, yPosition + 30);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px Arial";
    const organizerName = event.organizerName || "Event Organizer";
    ctx.fillText(organizerName, 80, yPosition + 60);

    yPosition += 110;

    // Attendee Info Card
    ctx.fillStyle = "rgba(59, 130, 246, 0.1)";
    ctx.fillRect(60, yPosition, 370, 160);
    ctx.strokeStyle = "rgba(59, 130, 246, 0.3)";
    ctx.strokeRect(60, yPosition, 370, 160);

    ctx.fillStyle = "#60a5fa";
    ctx.font = "bold 16px Arial";
    ctx.fillText("👤 ATTENDEE", 80, yPosition + 30);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px Arial";
    ctx.fillText(user.name || "Guest", 80, yPosition + 65);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "14px Arial";
    ctx.fillText("📧 " + (user.email || "No email"), 80, yPosition + 95);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "14px Arial";
    ctx.fillText("📱 " + (user.phone || "No phone"), 80, yPosition + 115);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "13px Arial";
    ctx.fillText(`ID: ${user.id?.slice(-8) || "N/A"}`, 80, yPosition + 135);

    // Tickets & Status Card
    ctx.fillStyle = "rgba(16, 185, 129, 0.1)"; // green tint
    ctx.fillRect(470, yPosition, 370, 160);
    ctx.strokeStyle = "rgba(16, 185, 129, 0.3)";
    ctx.strokeRect(470, yPosition, 370, 160);

    ctx.fillStyle = "#34d399"; // green-400
    ctx.font = "bold 16px Arial";
    ctx.fillText("🎫 TICKET DETAILS", 490, yPosition + 30);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px Arial";
    ctx.fillText(`${booking.tickets}`, 490, yPosition + 70);
    ctx.font = "16px Arial";
    ctx.fillText("Ticket(s)", 540, yPosition + 70);

    // Status Badge
    ctx.fillStyle = "#10b981"; // green-500
    ctx.fillRect(490, yPosition + 95, 140, 32);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px Arial";
    ctx.fillText("✓ CONFIRMED", 510, yPosition + 117);

    yPosition += 170;

    // QR Code Section - Modern centered design
    yPosition += 30;

    // Stylish separator
    const qrSeparatorGradient = ctx.createLinearGradient(
      60,
      yPosition,
      840,
      yPosition
    );
    qrSeparatorGradient.addColorStop(0, "rgba(139, 92, 246, 0)");
    qrSeparatorGradient.addColorStop(0.5, "rgba(139, 92, 246, 0.5)");
    qrSeparatorGradient.addColorStop(1, "rgba(139, 92, 246, 0)");
    ctx.fillStyle = qrSeparatorGradient;
    ctx.fillRect(60, yPosition, 780, 2);

    yPosition += 50;

    // Check if ticket is already scanned
    if (booking.paymentId && booking.paymentId.startsWith("SCANNED_")) {
      // Thank you message for scanned tickets
      ctx.fillStyle = "#10b981"; // green-500
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "center";
      ctx.fillText("THANK YOU FOR VISITING!", 450, yPosition);

      ctx.fillStyle = "#34d399"; // green-400
      ctx.font = "18px Arial";
      ctx.fillText("Enjoy the Event!", 450, yPosition + 35);

      yPosition += 80;

      // Thank you container
      const thankYouGradient = ctx.createLinearGradient(
        200,
        yPosition,
        700,
        yPosition + 200
      );
      thankYouGradient.addColorStop(0, "rgba(16, 185, 129, 0.1)");
      thankYouGradient.addColorStop(1, "rgba(52, 211, 153, 0.2)");
      ctx.fillStyle = thankYouGradient;
      ctx.fillRect(200, yPosition, 500, 200);

      // Border for thank you box
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 3;
      ctx.strokeRect(200, yPosition, 500, 200);

      // Thank you icon (checkmark)
      ctx.fillStyle = "#10b981";
      ctx.font = "80px Arial";
      ctx.fillText("✓", 450, yPosition + 120);

      ctx.fillStyle = "#064e3b"; // darker green
      ctx.font = "16px Arial";
      ctx.fillText("TICKET VERIFIED ✓", 450, yPosition + 140);

      ctx.fillStyle = "#064e3b";
      ctx.font = "14px Arial";
      ctx.fillText(
        `Verified At: ${new Date(
          booking.paymentId.replace("SCANNED_", "")
        ).toLocaleString()}`,
        450,
        yPosition + 165
      );

      // Add attendee details
      ctx.fillStyle = "#047857";
      ctx.font = "12px Arial";
      ctx.fillText(`Attendee: ${user?.name || "N/A"}`, 450, yPosition + 185);
      ctx.fillText(`Email: ${user?.email || "N/A"}`, 450, yPosition + 200);
      ctx.fillText(`Phone: ${user?.phone || "N/A"}`, 450, yPosition + 215);
      ctx.fillText(`Tickets: ${booking.tickets || 1}`, 450, yPosition + 230);

      yPosition += 250;
    } else {
      // Regular QR code(s) for unscanned tickets
      const eventDays = calculateEventDays(event);

      if (eventDays === 1) {
        // Single day event - one QR code
        const qrData = booking.id;
        const isScanned = isQRScanned(booking, 1, qrData);

        ctx.fillStyle = "#a78bfa"; // violet-400
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          isScanned ? "ENTRY USED" : "SCAN FOR ENTRY",
          450,
          yPosition
        );

        ctx.fillStyle = "#94a3b8";
        ctx.font = "14px Arial";
        if (isScanned) {
          const scanInfo = getQRScanInfo(booking, 1, qrData);
          const scanDate = scanInfo
            ? new Date(scanInfo.scannedAt).toLocaleString()
            : "Previously";
          ctx.fillText(
            `This ticket was scanned on ${scanDate}`,
            450,
            yPosition + 25
          );
        } else {
          ctx.fillText(
            "Present this QR code at the venue entrance",
            450,
            yPosition + 25
          );
        }

        yPosition += 60;

        if (isScanned) {
          // Show "USED" message instead of QR code
          ctx.fillStyle = "rgba(220, 38, 38, 0.1)"; // Red background
          ctx.fillRect(300, yPosition, 300, 300);

          // Red border
          ctx.strokeStyle = "#dc2626";
          ctx.lineWidth = 3;
          ctx.strokeRect(300, yPosition, 300, 300);

          // "USED" text
          ctx.fillStyle = "#dc2626";
          ctx.font = "bold 48px Arial";
          ctx.textAlign = "center";
          ctx.fillText("USED", 450, yPosition + 160);

          // Scan date
          const scanInfo = getQRScanInfo(booking, 1, qrData);
          if (scanInfo) {
            ctx.fillStyle = "#991b1b";
            ctx.font = "14px Arial";
            ctx.fillText(
              `Scanned: ${new Date(scanInfo.scannedAt).toLocaleString()}`,
              450,
              yPosition + 190
            );
          }
        } else {
          // Show QR code
          const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
            qrData
          )}`;
          const qrImage = await loadImage(qrCodeUrl);

          // Modern QR container with glow effect
          ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
          ctx.fillRect(300, yPosition, 300, 300);

          // Border with gradient
          const qrBorderGradient = ctx.createLinearGradient(
            300,
            yPosition,
            600,
            yPosition + 300
          );
          qrBorderGradient.addColorStop(0, "#3b82f6");
          qrBorderGradient.addColorStop(0.5, "#8b5cf6");
          qrBorderGradient.addColorStop(1, "#3b82f6");
          ctx.strokeStyle = qrBorderGradient;
          ctx.lineWidth = 3;
          ctx.strokeRect(300, yPosition, 300, 300);

          // White background for QR
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(320, yPosition + 20, 260, 260);

          // Draw QR code
          ctx.drawImage(qrImage, 320, yPosition + 20, 260, 260);
        }

        // QR Code ID below
        ctx.fillStyle = "#64748b";
        ctx.font = "12px monospace";
        ctx.fillText(booking.id, 450, yPosition + 330);

        yPosition += 400; // Increased spacing from 350 to 400
      } else {
        // Multi-day event - multiple QR codes
        ctx.fillStyle = "#a78bfa"; // violet-400
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          `MULTI-DAY EVENT QR CODES (${eventDays} Days)`,
          450,
          yPosition
        );

        ctx.fillStyle = "#94a3b8";
        ctx.font = "14px Arial";
        ctx.fillText(
          "Use the appropriate QR code for each day of the event",
          450,
          yPosition + 25
        );

        yPosition += 60;

        // Calculate QR code layout
        const qrSize = eventDays <= 3 ? 200 : 150; // Smaller QR codes for more days
        const qrPadding = 20;
        const qrPerRow = Math.min(3, eventDays); // Max 3 QR codes per row
        const totalRows = Math.ceil(eventDays / qrPerRow);

        // Calculate starting position to center the QR codes
        const totalWidth = qrSize * qrPerRow + qrPadding * (qrPerRow - 1);
        const startX = (900 - totalWidth) / 2;

        for (let day = 0; day < eventDays; day++) {
          const row = Math.floor(day / qrPerRow);
          const col = day % qrPerRow;

          const qrX = startX + col * (qrSize + qrPadding);
          const qrY = yPosition + row * (qrSize + 80); // 80px spacing between rows

          // Generate day-specific QR data
          const dayQRData = generateDayQRData(booking, day, eventDays);
          const dayNumber = day + 1;
          const isScanned = isQRScanned(booking, dayNumber, dayQRData);

          // Day-specific border colors
          const borderColors = [
            ["#3b82f6", "#8b5cf6"], // Blue to Purple
            ["#10b981", "#34d399"], // Green shades
            ["#f59e0b", "#fbbf24"], // Orange shades
            ["#ef4444", "#f87171"], // Red shades
            ["#8b5cf6", "#a78bfa"], // Purple shades
            ["#06b6d4", "#22d3ee"], // Cyan shades
            ["#84cc16", "#a3e635"], // Lime shades
          ];
          const colorIndex = day % borderColors.length;

          if (isScanned) {
            // Show "USED" message for scanned QR codes
            ctx.fillStyle = "rgba(220, 38, 38, 0.1)"; // Red background
            ctx.fillRect(qrX, qrY, qrSize, qrSize);

            // Red border for used QR
            ctx.strokeStyle = "#dc2626";
            ctx.lineWidth = 3;
            ctx.strokeRect(qrX, qrY, qrSize, qrSize);

            // "USED" text
            ctx.fillStyle = "#dc2626";
            ctx.font = `bold ${qrSize < 180 ? "24" : "32"}px Arial`;
            ctx.textAlign = "center";
            ctx.fillText("USED", qrX + qrSize / 2, qrY + qrSize / 2 + 8);

            // Smaller scan info for multi-day
            const scanInfo = getQRScanInfo(booking, dayNumber, dayQRData);
            if (scanInfo && qrSize >= 180) {
              ctx.fillStyle = "#991b1b";
              ctx.font = "10px Arial";
              ctx.fillText(
                new Date(scanInfo.scannedAt).toLocaleDateString(),
                qrX + qrSize / 2,
                qrY + qrSize / 2 + 30
              );
            }
          } else {
            // Show QR code for unscanned codes
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
              dayQRData
            )}`;
            const qrImage = await loadImage(qrCodeUrl);

            // QR container background
            ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
            ctx.fillRect(qrX, qrY, qrSize, qrSize);

            // Border with gradient
            const qrBorderGradient = ctx.createLinearGradient(
              qrX,
              qrY,
              qrX + qrSize,
              qrY + qrSize
            );
            qrBorderGradient.addColorStop(0, borderColors[colorIndex][0]);
            qrBorderGradient.addColorStop(1, borderColors[colorIndex][1]);
            ctx.strokeStyle = qrBorderGradient;
            ctx.lineWidth = 3;
            ctx.strokeRect(qrX, qrY, qrSize, qrSize);

            // White background for QR
            const qrPadding2 = 10;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(
              qrX + qrPadding2,
              qrY + qrPadding2,
              qrSize - qrPadding2 * 2,
              qrSize - qrPadding2 * 2
            );

            // Draw QR code
            ctx.drawImage(
              qrImage,
              qrX + qrPadding2,
              qrY + qrPadding2,
              qrSize - qrPadding2 * 2,
              qrSize - qrPadding2 * 2
            );
          }

          // Day label
          ctx.fillStyle = isScanned ? "#dc2626" : borderColors[colorIndex][0];
          ctx.font = "bold 14px Arial";
          ctx.textAlign = "center";
          ctx.fillText(
            `DAY ${dayNumber}${isScanned ? " ✓" : ""}`,
            qrX + qrSize / 2,
            qrY + qrSize + 20
          );

          // Date for this day
          const dayDate = new Date(event.date);
          dayDate.setDate(dayDate.getDate() + day);
          ctx.fillStyle = isScanned ? "#991b1b" : "#64748b";
          ctx.font = "10px Arial";
          ctx.fillText(
            dayDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            qrX + qrSize / 2,
            qrY + qrSize + 35
          );
        }

        // Update yPosition based on the number of rows
        yPosition += totalRows * (qrSize + 80) + 80; // Increased spacing from 40 to 80
      }
    }

    ctx.textAlign = "left";

    // Footer Instructions with modern card design
    yPosition += 60; // Reduced spacing from 390 to 60

    // Instructions card
    const instructionsGradient = ctx.createLinearGradient(
      60,
      yPosition,
      840,
      yPosition + 140
    );
    instructionsGradient.addColorStop(0, "rgba(30, 64, 175, 0.8)");
    instructionsGradient.addColorStop(1, "rgba(99, 102, 241, 0.8)");
    ctx.fillStyle = instructionsGradient;
    ctx.fillRect(60, yPosition, 780, 140);

    // Border for instructions
    ctx.strokeStyle = "rgba(147, 197, 253, 0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(60, yPosition, 780, 140);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px Arial";
    ctx.fillText("⚠️ IMPORTANT INSTRUCTIONS", 90, yPosition + 35);

    ctx.font = "15px Arial";
    ctx.fillStyle = "#dbeafe";
    ctx.fillText(
      "✓ Present this ticket (digital or printed) at venue entrance",
      90,
      yPosition + 65
    );
    ctx.fillText(
      "✓ QR code will be scanned for verification",
      90,
      yPosition + 90
    );
    ctx.fillText(
      "✓ Each ticket can only be scanned once - No re-entry",
      90,
      yPosition + 115
    );

    // Modern footer
    yPosition += 170;
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.fillRect(60, yPosition, 780, 1);

    yPosition += 30;
    ctx.fillStyle = "#64748b";
    ctx.font = "13px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Powered by EventHub • AI-Generated E-Ticket", 450, yPosition);

    ctx.fillStyle = "#475569";
    ctx.font = "11px Arial";
    ctx.fillText(
      `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
      450,
      yPosition + 20
    );
    ctx.textAlign = "left";

    // Return buffer
    return canvas.toBuffer("image/png");
  } catch (error) {
    console.error("Error generating ticket image:", error);
    throw error;
  }
}
