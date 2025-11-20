#!/bin/sh
set -e

# Configuration from environment variables
SURREALDB_URL="${SURREALDB_URL:-http://surrealdb:8000}"
SURREALDB_USER="${SURREALDB_USER:-root}"
SURREALDB_PASS="${SURREALDB_PASS:-root}"
SURREALDB_NS="${SURREALDB_NS:-Aulirya}"
SURREALDB_DB="${SURREALDB_DB:-saas}"

SEEDS_DIR="/seeds"
MAX_RETRIES=10
RETRY_INTERVAL=2

echo "🌱 SurrealDB Database Seeder"
echo "================================"
echo "Database: ${SURREALDB_URL}"
echo "Namespace: ${SURREALDB_NS}"
echo "Database: ${SURREALDB_DB}"
echo ""

# Wait for SurrealDB to be ready
echo "⏳ Waiting for SurrealDB to be ready..."
retry_count=0
until curl -sf "${SURREALDB_URL}/health" > /dev/null 2>&1; do
    retry_count=$((retry_count + 1))
    if [ $retry_count -ge $MAX_RETRIES ]; then
        echo "❌ SurrealDB did not become ready in time"
        exit 1
    fi
    echo "   Retry $retry_count/$MAX_RETRIES..."
    sleep $RETRY_INTERVAL
done
echo "✅ SurrealDB is ready"
echo ""

# Delete all data from tables (in order respecting foreign keys)
echo "🗑️  Clearing existing data..."
echo "   Deleting course_progress records..."
curl -s -X POST "${SURREALDB_URL}/sql" \
    -H "Accept: application/json" \
    -u "${SURREALDB_USER}:${SURREALDB_PASS}" \
    -d "USE NS ${SURREALDB_NS}; USE DB ${SURREALDB_DB}; DELETE FROM course_progress;" \
    > /dev/null 2>&1

echo "   Deleting lessons records..."
curl -s -X POST "${SURREALDB_URL}/sql" \
    -H "Accept: application/json" \
    -u "${SURREALDB_USER}:${SURREALDB_PASS}" \
    -d "USE NS ${SURREALDB_NS}; USE DB ${SURREALDB_DB}; DELETE FROM lessons;" \
    > /dev/null 2>&1

echo "   Deleting subjects records..."
curl -s -X POST "${SURREALDB_URL}/sql" \
    -H "Accept: application/json" \
    -u "${SURREALDB_USER}:${SURREALDB_PASS}" \
    -d "USE NS ${SURREALDB_NS}; USE DB ${SURREALDB_DB}; DELETE FROM subjects;" \
    > /dev/null 2>&1

echo "   Deleting classes records..."
curl -s -X POST "${SURREALDB_URL}/sql" \
    -H "Accept: application/json" \
    -u "${SURREALDB_USER}:${SURREALDB_PASS}" \
    -d "USE NS ${SURREALDB_NS}; USE DB ${SURREALDB_DB}; DELETE FROM classes;" \
    > /dev/null 2>&1

echo "   Deleting users records..."
curl -s -X POST "${SURREALDB_URL}/sql" \
    -H "Accept: application/json" \
    -u "${SURREALDB_USER}:${SURREALDB_PASS}" \
    -d "USE NS ${SURREALDB_NS}; USE DB ${SURREALDB_DB}; DELETE FROM users;" \
    > /dev/null 2>&1

echo "✅ All existing data cleared"
echo ""

# Apply seed data
echo "🌱 Seeding database..."
seed_file="${SEEDS_DIR}/seed_data.surql"

if [ ! -f "$seed_file" ]; then
    echo "❌ Seed file not found: $seed_file"
    exit 1
fi

echo "   📦 Loading seed data from seed_data.surql..."

# Apply the seed data (prepend USE statements)
seed_sql="USE NS ${SURREALDB_NS}; USE DB ${SURREALDB_DB}; $(cat ${seed_file})"
response=$(curl -s -X POST "${SURREALDB_URL}/sql" \
    -H "Accept: application/json" \
    -u "${SURREALDB_USER}:${SURREALDB_PASS}" \
    -d "$seed_sql")

echo "   📋 Response from SurrealDB (first 50 lines):"
echo "$response" | head -50
echo ""

# Check for errors
if echo "$response" | grep -q '"status":"ERR"'; then
    echo "   ❌ Error applying seed data:"
    echo "$response" | grep -o '"result":"[^"]*"' | head -10
    exit 1
fi

echo "   ✅ Seed data loaded successfully"
echo ""

# Verify data was inserted
echo "📊 Verifying data insertion..."
verification=$(curl -s -X POST "${SURREALDB_URL}/sql" \
    -H "Accept: application/json" \
    -u "${SURREALDB_USER}:${SURREALDB_PASS}" \
    -d "USE NS ${SURREALDB_NS}; USE DB ${SURREALDB_DB}; SELECT count() FROM users GROUP ALL; SELECT count() FROM classes GROUP ALL; SELECT count() FROM subjects GROUP ALL; SELECT count() FROM lessons GROUP ALL; SELECT count() FROM course_progress GROUP ALL;")

echo "$verification"
echo ""
echo "✨ Database seeding complete!"