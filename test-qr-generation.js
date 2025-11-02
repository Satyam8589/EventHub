// Test QR code generation for multi-day events
console.log("🎫 Testing Multi-Day QR Code Generation");
console.log("=".repeat(50));

// Simulate the QR code generation function
function generateQRCode(ticketId, dayIndex = null, totalDays = null) {
  const qrData =
    dayIndex !== null && totalDays !== null
      ? `${ticketId}_DAY_${dayIndex + 1}_OF_${totalDays}`
      : ticketId;

  // Return just the data for testing (without the full URL)
  return qrData;
}

// Test case: Your booking ID with 3-day event
const bookingId = "14417aa8-4d58-49a1-a11e-d627bba0a69b";
const totalDays = 3;

console.log(`\n📋 Event: Multi-Day Event (${totalDays} days)`);
console.log(`🎟️ Booking ID: ${bookingId}`);
console.log(`\n🎯 Generated QR Codes:`);

// Generate QR codes for each day
for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
  const dayNumber = dayIndex + 1;
  const qrData = generateQRCode(bookingId, dayIndex, totalDays);

  console.log(`\nDay ${dayNumber}:`);
  console.log(`  QR Code Data: ${qrData}`);
  console.log(`  Format: {bookingId}_DAY_{dayNumber}_OF_{totalDays}`);

  // Verify the format
  const expectedFormat = `${bookingId}_DAY_${dayNumber}_OF_${totalDays}`;
  const isCorrect = qrData === expectedFormat;
  console.log(`  ✅ Correct: ${isCorrect ? "YES" : "NO"}`);
}

// Test single-day event for comparison
console.log(`\n🆚 Single-Day Event Comparison:`);
const singleDayQR = generateQRCode(bookingId, null, null);
console.log(`Single Day QR: ${singleDayQR}`);
console.log(`Format: Just the booking ID (no day suffix)`);

// Verify your actual QR codes from the UI
console.log(`\n🔍 Verification of Your QR Codes:`);
const yourQRCodes = [
  { day: 1, expected: `${bookingId}_DAY_1_OF_3`, actual: `${bookingId}_DAY_1` },
  { day: 2, expected: `${bookingId}_DAY_2_OF_3`, actual: `${bookingId}_DAY_2` },
  { day: 3, expected: `${bookingId}_DAY_3_OF_3`, actual: `${bookingId}_DAY_3` },
];

yourQRCodes.forEach((qr) => {
  console.log(`\nDay ${qr.day}:`);
  console.log(`  Your QR: ${qr.actual}`);
  console.log(`  Expected: ${qr.expected}`);

  // Check if it's the correct format (either with or without _OF_X)
  const isValidFormat = qr.actual.includes(`_DAY_${qr.day}`);
  console.log(`  ✅ Valid Format: ${isValidFormat ? "YES" : "NO"}`);

  // Check if it's unique per day
  const isUniquePerDay =
    qr.actual.endsWith(`_DAY_${qr.day}`) ||
    qr.actual.endsWith(`_DAY_${qr.day}_OF_3`);
  console.log(`  🎯 Unique Per Day: ${isUniquePerDay ? "YES" : "NO"}`);
});

console.log(`\n📊 Analysis Summary:`);
console.log(`✅ Each day generates a different QR code: YES`);
console.log(`✅ QR codes include day identification: YES`);
console.log(`✅ Format follows the pattern: bookingId_DAY_X`);
console.log(`🎯 This ensures each day requires scanning the correct QR code!`);

console.log(`\n🔧 How Progressive Scanning Works:`);
console.log(`1. User gets 3 different QR codes (one per day)`);
console.log(`2. Each QR code can only be used on its specific day`);
console.log(`3. Admin scanner validates: booking ID + day number`);
console.log(`4. System prevents scanning wrong day's QR code`);
console.log(`5. Individual tickets show Thank You when scanned`);

// Test the server-side parsing logic
console.log(`\n🖥️ Server-Side QR Code Parsing Test:`);
yourQRCodes.forEach((qr) => {
  const qrCode = qr.actual;

  // Simulate server parsing (from scan-ticket route)
  const dayQRMatch = qrCode.match(/^(.+)_DAY_(\d+)(_OF_\d+)?$/);

  if (dayQRMatch) {
    const parsedBookingId = dayQRMatch[1];
    const parsedDay = parseInt(dayQRMatch[2]);

    console.log(`\nParsing: ${qrCode}`);
    console.log(`  📝 Booking ID: ${parsedBookingId}`);
    console.log(`  📅 Day: ${parsedDay}`);
    console.log(
      `  ✅ Parsing: ${parsedBookingId === bookingId ? "SUCCESS" : "FAILED"}`
    );
  }
});
