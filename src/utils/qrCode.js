// QR Code generation utility for bookings
import { QRCodeSVG } from "qrcode.react";

export function generateBookingQR(bookingId) {
  // The QR code contains the booking ID that admins can scan
  return bookingId;
}

export function BookingQRCode({ bookingId, size = 128 }) {
  return (
    <QRCodeSVG
      value={bookingId}
      size={size}
      bgColor="#ffffff"
      fgColor="#000000"
      level="M"
      includeMargin={true}
    />
  );
}

export function downloadQRCode(bookingId, eventTitle = "Event") {
  // Create a canvas to generate downloadable QR code
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const size = 300;

  canvas.width = size;
  canvas.height = size + 80; // Extra space for text

  // White background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Generate QR code using a library like qrcode
  // This is a placeholder - in real implementation you'd use qrcode library

  // Add text
  ctx.fillStyle = "#000000";
  ctx.font = "16px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`Ticket for ${eventTitle}`, size / 2, size + 30);
  ctx.fillText(`Booking ID: ${bookingId}`, size / 2, size + 55);

  // Download the canvas as image
  const link = document.createElement("a");
  link.download = `ticket-${bookingId}.png`;
  link.href = canvas.toDataURL();
  link.click();
}

export default {
  generateBookingQR,
  BookingQRCode,
  downloadQRCode,
};
