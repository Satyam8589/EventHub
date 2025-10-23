import { PrismaClient } from "@prisma/client";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

const globalForPrisma = globalThis;

let prisma;

if (process.env.NODE_ENV === "production") {
  // Use Neon serverless adapter in production (no binary files needed!)
  neonConfig.webSocketConstructor = ws;
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool);
  prisma = new PrismaClient({ 
    adapter,
    log: ["error"]
  });
} else {
  // Use regular Prisma Client in development
  prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
      log: ["query", "error", "warn"],
    });
  globalForPrisma.prisma = prisma;
}

export { prisma };

// Graceful shutdown
if (typeof window === "undefined") {
  process.on("SIGTERM", async () => {
    await prisma.$disconnect();
  });
}
