import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function GET() {
  try {
    console.log("🔍 Checking available Gemini AI models...");

    // Try to list models (if the SDK supports it)
    try {
      const models = await genAI.listModels();
      console.log("✅ Available models:", models);
      
      return NextResponse.json({
        success: true,
        models: models,
        message: "Models listed successfully"
      });
    } catch (listError) {
      console.log("⚠️ listModels not available, trying common models...");
      
      // Try common model names
      const modelsToTry = [
        "gemini-1.5-pro",
        "gemini-1.5-flash",
        "gemini-pro",
        "gemini-pro-vision",
        "models/gemini-1.5-pro",
        "models/gemini-1.5-flash",
        "models/gemini-pro"
      ];
      
      const results = [];
      
      for (const modelName of modelsToTry) {
        try {
          console.log(`Testing model: ${modelName}`);
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent("Say 'test successful' if you can read this.");
          const response = result.response.text();
          
          results.push({
            model: modelName,
            status: "✅ Working",
            response: response.substring(0, 100)
          });
          
          console.log(`✅ ${modelName} works!`);
        } catch (error) {
          results.push({
            model: modelName,
            status: "❌ Failed",
            error: error.message.substring(0, 100)
          });
          
          console.log(`❌ ${modelName} failed:`, error.message.substring(0, 50));
        }
      }
      
      return NextResponse.json({
        success: true,
        results: results,
        message: "Model testing complete",
        recommendation: results.find(r => r.status === "✅ Working")?.model || "None found"
      });
    }
  } catch (error) {
    console.error("❌ Error checking models:", error);
    return NextResponse.json(
      {
        error: "Failed to check models",
        details: error.message,
        apiKey: process.env.GEMINI_API_KEY ? "Set (length: " + process.env.GEMINI_API_KEY.length + ")" : "Not set"
      },
      { status: 500 }
    );
  }
}
