# Database Migration Service

A custom Docker-based migration system for SurrealDB, inspired by [surrealdb-migrations](https://github.com/odonno/surrealdb-migrations).

## Overview

This migration service provides a lightweight, Docker-native solution for managing database schema evolution. It runs as an ephemeral container that automatically applies versioned migrations to SurrealDB on startup, with built-in idempotency and error handling.

## Architecture

### Why This Approach?

**Docker-First Design**
- Migrations run in an isolated Alpine container with minimal dependencies
- No local tooling required (no Rust installation, no CLI binaries)
- Consistent execution environment across development and production
- Integrates seamlessly with Docker Compose orchestration

**Custom Implementation vs. surrealdb-migrations CLI**

We chose to implement a custom migration system rather than using the official `surrealdb-migrations` tool:

1. **Simplicity** - ~90 lines of bash vs external Rust dependency
2. **Control** - Full visibility into migration logic and error handling
3. **Compatibility** - Better control over SurrealDB version compatibility
4. **Docker-Native** - Built specifically for containerized workflows
5. **Minimal Dependencies** - Only requires `curl`, `bash`, and `grep` (standard Alpine packages)

**HTTP API Over CLI**
- Uses SurrealDB's `/sql` endpoint instead of the `surreal` CLI tool
- More predictable behavior in Docker contexts
- Easier to script and debug

### Design Decisions

**Migration Tracking**
- Uses `_migrations` table in SurrealDB itself (not external state)
- Self-contained, no additional infrastructure required
- Migrations tracked by filename with applied timestamp

**Idempotency**
- Primary: Migration tracking table prevents re-applying completed migrations
- Secondary: All `DEFINE` statements use `IF NOT EXISTS` clauses
- Error handling ignores "already exists" errors but fails on genuine issues

**File-Based Migrations**
- Plain `.surql` files with timestamp prefixes
- Human-readable, easy to version control
- No complex DSL or framework to learn

## How It Works

### Container Architecture

```dockerfile
FROM alpine:latest
RUN apk add --no-cache curl bash grep
COPY scripts/migrate.sh /migrate.sh
RUN chmod +x /migrate.sh
ENTRYPOINT ["/migrate.sh"]
```

**Minimal footprint** - Only essential tools for HTTP requests and text processing

### Migration Execution Flow

#### 1. Configuration
All settings configurable via environment variables with sensible defaults:
- Database URL, credentials, namespace, and database name
- Health check retry settings

#### 2. Health Check & Retry Logic
- Polls SurrealDB `/health` endpoint (max 10 retries, 2-second intervals)
- Handles Docker Compose race conditions
- Fails fast if database doesn't start

#### 3. Migration Tracking Setup
```surql
DEFINE TABLE IF NOT EXISTS _migrations SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS name ON _migrations TYPE string;
DEFINE FIELD IF NOT EXISTS applied_at ON _migrations TYPE datetime DEFAULT time::now();
DEFINE INDEX IF NOT EXISTS unique_migration_name ON _migrations FIELDS name UNIQUE;
```
Creates tracking table automatically with unique constraint on migration names.

#### 4. Migration Discovery & Application

**For each `.surql` file in `/migrations` (sorted alphabetically):**

1. Check if already applied
2. Apply migration if new
3. Record success in tracking table
4. Handle errors (ignore "already exists", fail on genuine errors)

### Integration with Docker Compose

The migration service runs as a dependent service:
- Starts after SurrealDB is ready
- Retries on failure (up to 3 times)
- Mounts migrations directory as read-only
- Shares network with database

**Startup sequence:** SurrealDB → Migrations → Backend → Frontend

## Developer Workflow

### Quick Start

```bash
# Start everything (database + migrations + services)
make dev

# Run migrations only
make migrate

# Create a new migration
make migration-create NAME=add_users_table
```

### Creating a New Migration

1. **Generate the migration file**
   ```bash
   make migration-create NAME=descriptive_name
   ```

   Creates: `database/migrations/YYYYMMDD_HHmmss_descriptive_name.surql`

2. **Write your migration**
   ```surql
   -- Migration: descriptive_name
   -- Created: [timestamp]

   USE NS your_namespace;
   USE DB your_database;

   DEFINE TABLE IF NOT EXISTS my_table SCHEMAFULL;
   DEFINE FIELD IF NOT EXISTS name ON my_table TYPE string;
   ```

3. **Apply the migration**
   ```bash
   make migrate
   ```

### Best Practices

**Always use `IF NOT EXISTS`**
```surql
DEFINE TABLE IF NOT EXISTS users ...
DEFINE FIELD IF NOT EXISTS email ON users ...
DEFINE INDEX IF NOT EXISTS idx_email ON users ...
```
This ensures migrations are truly idempotent.

**One logical change per migration**
- ✅ `20251109_001_create_users_table.surql`
- ✅ `20251109_002_add_email_index.surql`
- ❌ `20251109_001_everything.surql`

**Test migrations before committing**
```bash
# Apply migration
make migrate

# Verify it's idempotent (should be safe to run twice)
make migrate
```

## Directory Structure

```
database/
├── .surrealdb              # Config reference (for surrealdb-migrations CLI)
├── Dockerfile              # Migration runner container definition
├── migrations/             # ⭐ Migration files (applied in order)
│   └── YYYYMMDD_NNN_description.surql
├── schemas/                # Schema documentation (NOT auto-applied)
│   └── table_name.surql
├── events/                 # Event triggers
└── scripts/
    └── migrate.sh          # Migration execution logic
```

**Note on `schemas/` directory:**
- Documentation/reference files only
- Show individual table definitions for easy reference
- NOT automatically applied by the migration system
- Actual schema changes must be in timestamped migration files

## Configuration

### Environment Variables

Configure via environment variables (see `.env.example`):

- `SURREALDB_URL` - Database HTTP endpoint
- `SURREALDB_USER` - Database username
- `SURREALDB_PASS` - Database password
- `SURREALDB_NS` - SurrealDB namespace
- `SURREALDB_DB` - Database name

All variables have sensible defaults for local development.

## Troubleshooting

### Migration fails with "SurrealDB did not become ready in time"
- SurrealDB is not starting properly
- Check `docker-compose logs surrealdb`
- Increase retry settings in `migrate.sh` if needed

### Migration shows error but continues
- Expected for "already exists" errors (idempotency)
- Genuine errors will cause the container to exit with code 1

### Want to re-run a specific migration
```bash
# 1. Remove from tracking table
DELETE FROM _migrations WHERE name = 'migration_filename.surql';

# 2. Re-run migrations
make migrate
```

### Check migration status
```surql
SELECT * FROM _migrations ORDER BY applied_at;
```

## Technical Reference

### Migration Naming Convention
```
YYYYMMDD_NNN_description.surql
```
- `YYYYMMDD` - Date (for chronological ordering)
- `NNN` - Sequence number (001, 002, etc.)
- `description` - Snake_case description
- `.surql` - SurrealDB SQL file extension

### Idempotency Guarantees

✅ **Safe to run multiple times:**
- Migration tracking prevents re-applying completed migrations
- `IF NOT EXISTS` clauses make individual statements safe
- "Already exists" errors are ignored

✅ **Safe to restart mid-migration:**
- Each migration is atomic (all-or-nothing)
- Failed migrations are not recorded as applied
- Container will retry on failure (up to 3 times)

### Key Files

| File | Purpose |
|------|---------|
| `database/Dockerfile` | Migration runner container |
| `database/scripts/migrate.sh` | Migration execution logic |
| `database/migrations/*.surql` | Versioned schema changes |
| `docker-compose.yml` | Service orchestration |
| `Makefile` | Developer commands |

---

**Inspired by:** [odonno/surrealdb-migrations](https://github.com/odonno/surrealdb-migrations)
**Implementation:** Custom Docker-based solution for simplified workflows
