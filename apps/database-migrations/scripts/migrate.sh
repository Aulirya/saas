#!/bin/sh
set -e

# Configuration from environment variables
SURREALDB_URL="${SURREALDB_URL:-http://surrealdb:8000}"
SURREALDB_USER="${SURREALDB_USER:-root}"
SURREALDB_PASS="${SURREALDB_PASS:-root}"
SURREALDB_NS="${SURREALDB_NS:-Aulirya}"
SURREALDB_DB="${SURREALDB_DB:-saas}"

MIGRATIONS_DIR="/migrations"
MAX_RETRIES=10
RETRY_INTERVAL=2

echo "🚀 SurrealDB Migration Runner"
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

# Create migrations tracking table
echo "📋 Setting up migration tracking..."
curl -s -X POST "${SURREALDB_URL}/sql" \
    -H "Accept: application/json" \
    -u "${SURREALDB_USER}:${SURREALDB_PASS}" \
    -d "USE NS ${SURREALDB_NS}; USE DB ${SURREALDB_DB};
        DEFINE TABLE IF NOT EXISTS _migrations SCHEMAFULL;
        DEFINE FIELD IF NOT EXISTS name ON _migrations TYPE string;
        DEFINE FIELD IF NOT EXISTS applied_at ON _migrations TYPE datetime DEFAULT time::now();
        DEFINE INDEX IF NOT EXISTS unique_migration_name ON _migrations FIELDS name UNIQUE;" \
    > /dev/null 2>&1
echo "✅ Migration tracking ready"
echo ""

# Apply migrations in order
echo "🔄 Applying migrations..."
for migration_file in $(ls -1 ${MIGRATIONS_DIR}/*.surql 2>/dev/null | sort); do
    migration_name=$(basename "$migration_file")

    # Check if migration has already been applied
    applied=$(curl -s -X POST "${SURREALDB_URL}/sql" \
        -H "Accept: application/json" \
        -u "${SURREALDB_USER}:${SURREALDB_PASS}" \
        -d "USE NS ${SURREALDB_NS}; USE DB ${SURREALDB_DB}; SELECT * FROM _migrations WHERE name = '${migration_name}';")

    if echo "$applied" | grep -q '"result":\[\]'; then
        echo "   📦 Applying: ${migration_name}"

        # Apply the migration (prepend USE statements)
        migration_sql="USE NS ${SURREALDB_NS}; USE DB ${SURREALDB_DB}; $(cat ${migration_file})"
        response=$(curl -s -X POST "${SURREALDB_URL}/sql" \
            -H "Accept: application/json" \
            -u "${SURREALDB_USER}:${SURREALDB_PASS}" \
            -d "$migration_sql")

        # Check for errors (excluding "already exists" errors which are OK)
        if echo "$response" | grep -q '"status":"ERR"' && ! echo "$response" | grep -q 'already exists'; then
            echo "   ❌ Error applying migration:"
            echo "$response" | grep -o '"result":"[^"]*"' | head -5
            exit 1
        fi

        # Record migration as applied
        curl -s -X POST "${SURREALDB_URL}/sql" \
            -H "Accept: application/json" \
            -u "${SURREALDB_USER}:${SURREALDB_PASS}" \
            -d "USE NS ${SURREALDB_NS}; USE DB ${SURREALDB_DB}; CREATE _migrations CONTENT { name: '${migration_name}' };" \
            > /dev/null 2>&1

        echo "   ✅ Applied: ${migration_name}"
    else
        echo "   ⏭️  Skipped: ${migration_name} (already applied)"
    fi
done

echo ""
echo "✨ Migration complete!"
