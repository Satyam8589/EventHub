// Test email import
import { sendTicketEmailWithRetry, generateBookingEmailHTML } from "./src/lib/email.js";

console.log("Testing email imports...");
console.log("sendTicketEmailWithRetry:", typeof sendTicketEmailWithRetry);
console.log("generateBookingEmailHTML:", typeof generateBookingEmailHTML);
console.log("Import test completed successfully!");