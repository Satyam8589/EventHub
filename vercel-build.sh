#!/bin/bash
set -e

echo "=== EventHub Vercel Build ==="
echo "Step 1: Installing dependencies (including dev dependencies)..."
npm ci --include=dev --prefer-offline --no-audit

echo "Step 2: Running postinstall to ensure Prisma engines are available..."
npm run postinstall

echo "Step 3: Verifying Prisma engines..."
ls -la node_modules/.prisma/client/ | grep -E "libquery|query_engine" || echo "Warning: Prisma engines may not be present"

echo "Step 4: Generating Prisma Client..."
npx prisma generate

echo "Step 5: Building Next.js application..."
npm run build

echo "=== Build Complete! ==="
