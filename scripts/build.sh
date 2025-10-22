#!/bin/bash
# Download Prisma engines for all target platforms
npx prisma generate --skip-engine-check || true
