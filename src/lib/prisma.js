import { PrismaClient } from "@prisma/client";
import { Pool } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis;

// Create Prisma client with Neon adapter for serverless environments
function createPrismaClient() {
  const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
  const isProduction = process.env.NODE_ENV === "production";
  
  console.log("🔧 Prisma Client Setup:", {
    isVercel: !!isVercel,
    isProduction,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasDirectUrl: !!process.env.DIRECT_URL,
    databaseUrlType: process.env.DATABASE_URL ? (process.env.DATABASE_URL.includes("neon") ? "neon" : "other") : "none"
  });

  // Use Neon adapter ONLY for Vercel deployments
  if (isVercel && process.env.DATABASE_URL && process.env.DATABASE_URL.includes("neon")) {
    try {
      console.log("🌐 Creating Neon adapter for Vercel...");
      const pool = new Pool({ 
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      const adapter = new PrismaNeon(pool);

      const client = new PrismaClient({
        adapter,
        log: ["error", "warn"],
        // Ensure correct engine path for Vercel
        __internal: {
          engine: {
            binaryTarget: "rhel-openssl-3.0.x"
          }
        }
      });
      
      console.log("✅ Neon adapter created successfully");
      return client;
    } catch (error) {
      console.error("❌ Failed to create Neon adapter:", error);
      console.error("📋 Falling back to standard Prisma client...");
    }
  }

  // Standard Prisma client for local development or fallback
  console.log("🔧 Creating standard Prisma client...");
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
if (typeof window === "undefined") {
  process.on("SIGTERM", async () => {
    await prisma.$disconnect();
  });
}
