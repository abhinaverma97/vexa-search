#!/bin/sh
set -e
echo "Running Prisma schema push..."
npx prisma db push --accept-data-loss
echo "Starting Next.js as nextjs user..."
exec gosu nextjs node server.js
