#!/bin/sh
set -e

echo "Installing curl and jq..."
apk add --no-cache curl jq

echo "Waiting for SurrealDB to be ready..."
for i in 1 2 3 4 5 6 7 8 9 10; do
  curl -f http://surrealdb:8000/health && break || sleep 2
done

echo "Running migration..."
curl -X POST \
  -H "Content-Type: application/octet-stream" \
  -H "Accept: application/json" \
  -u root:root \
  --data-binary @/database/init.surql \
  http://surrealdb:8000/sql

echo ""
echo "Verifying migration..."
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "NS: Aulirya" \
  -H "DB: saas" \
  -u root:root \
  -d "INFO FOR DB;" \
  http://surrealdb:8000/sql | jq '.'

echo ""
echo "Migration completed successfully!"
