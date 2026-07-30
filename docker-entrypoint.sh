#!/bin/sh
set -e
echo "Running Prisma schema push..."
npx prisma db push --accept-data-loss
echo "Generating Prisma client..."
npx prisma generate
chown -R nextjs:nodejs /app/data
echo "Starting Next.js as nextjs user..."
exec gosu nextjs node server.js
