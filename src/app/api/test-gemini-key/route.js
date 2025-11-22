import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    // Check if API key exists
    if (!apiKey) {
      return NextResponse.json({
        error: "GEMINI_API_KEY not found in environment variables",
        envCheck: {
          GEMINI_API_KEY: "❌ Not set",
          GMAIL_USER: process.env.GMAIL_USER ? "✅ Set" : "❌ Not set",
          GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD ? "✅ Set" : "❌ Not set"
        }
      });
    }
    
    // Check API key format
    const keyInfo = {
      exists: true,
      length: apiKey.length,
      startsWithAIza: apiKey.startsWith("AIza"),
      firstChars: apiKey.substring(0, 10) + "...",
      lastChars: "..." + apiKey.substring(apiKey.length - 5),
      hasQuotes: apiKey.includes('"') || apiKey.includes("'"),
      hasSpaces: apiKey.includes(" "),
      trimmedLength: apiKey.trim().length
    };
    
    // Test with a direct fetch to Google's API
    const testUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`;
    
    try {
      const response = await fetch(testUrl);
      const data = await response.json();
      
      if (response.ok) {
        return NextResponse.json({
          success: true,
          message: "API key is valid!",
          keyInfo: keyInfo,
          availableModels: data.models?.map(m => m.name) || [],
          fullResponse: data
        });
      } else {
        return NextResponse.json({
          error: "API key validation failed",
          keyInfo: keyInfo,
          statusCode: response.status,
          statusText: response.statusText,
          errorDetails: data
        });
      }
    } catch (fetchError) {
      return NextResponse.json({
        error: "Failed to connect to Google API",
        keyInfo: keyInfo,
        details: fetchError.message
      });
    }
  } catch (error) {
    return NextResponse.json({
      error: "Test failed",
      details: error.message
    }, { status: 500 });
  }
}
