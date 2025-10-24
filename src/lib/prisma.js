import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

// Simplified Prisma client - no adapters, just standard connection
function createPrismaClient() {
  console.log("🔧 Creating Prisma Client...", {
    env: process.env.NODE_ENV,
    hasDb: !!process.env.DATABASE_URL,
    dbType: process.env.DATABASE_URL?.includes('neon') ? 'neon' : 'other'
  });

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
}export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
if (typeof window === "undefined") {
  process.on("SIGTERM", async () => {
    await prisma.$disconnect();
  });
}
