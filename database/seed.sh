#!/bin/sh
set -e

echo "Waiting for SurrealDB to be ready..."
for i in 1 2 3 4 5 6 7 8 9 10; do
  curl -f http://localhost:8000/health && break || sleep 2
done

echo "Seeding database..."
curl -X POST \
  -H "Content-Type: application/octet-stream" \
  -H "Accept: application/json" \
  -u root:root \
  --data-binary @database/seed.surql \
  http://localhost:8000/sql

echo ""
echo "Seeding completed successfully!"
