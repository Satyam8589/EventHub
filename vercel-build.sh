#!/bin/bash
set -e

echo "Installing dependencies..."
npm ci

echo "Generating Prisma Client..."
npx prisma generate

echo "Building Next.js application..."
npm run build

echo "Build complete!"
