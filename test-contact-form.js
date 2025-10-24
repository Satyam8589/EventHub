// Test Contact Form Functionality
// Run this in browser console or use as Node.js script

const testContactForm = async () => {
  const testData = {
    name: "Test User",
    email: "test@example.com",
    phone: "9876543210",
    message: "This is a test message to verify contact form functionality.",
  };

  try {
    console.log("Testing contact form submission...");

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();

    console.log("Response Status:", response.status);
    console.log("Response Data:", result);

    if (response.ok && result.success) {
      console.log("✅ SUCCESS: Contact form is working!");
      console.log("Message Status:", result.messageStatus);
      console.log("Email Status:", result.emailStatus);
    } else {
      console.log("❌ ERROR: Contact form failed");
      console.log("Error:", result.error);
    }

    return result;
  } catch (error) {
    console.error("❌ Network Error:", error);
    return { error: error.message };
  }
};

// Test email endpoint
const testEmailEndpoint = async () => {
  try {
    console.log("Testing email endpoint...");

    const response = await fetch("/api/test-email");
    const result = await response.json();

    console.log("Email Test Response:", result);

    if (response.ok && result.success) {
      console.log("✅ EMAIL SUCCESS: Test email sent!");
    } else {
      console.log("❌ EMAIL ERROR:", result.error);
    }

    return result;
  } catch (error) {
    console.error("❌ Email Network Error:", error);
    return { error: error.message };
  }
};

// Run tests
console.log("=== EventHub Contact Form Test Suite ===");
console.log("Run these functions in browser console:");
console.log("1. testContactForm() - Test contact form submission");
console.log("2. testEmailEndpoint() - Test email functionality");

// Export for use
if (typeof module !== "undefined" && module.exports) {
  module.exports = { testContactForm, testEmailEndpoint };
}

// Auto-run if in browser
if (typeof window !== "undefined") {
  window.testContactForm = testContactForm;
  window.testEmailEndpoint = testEmailEndpoint;

  console.log("Functions available: testContactForm(), testEmailEndpoint()");
}
