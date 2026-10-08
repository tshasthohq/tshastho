#!/bin/bash
# Database Backup Script
# Usage: ./scripts/backup-db.sh

set -e

# Load env
if [ -f .env ]; then
  export $(grep -v '^#' .env | grep DATABASE_URL | xargs)
  export $(grep -v '^#' .env | grep DIRECT_URL | xargs)
fi

DB_URL="${DIRECT_URL:-$DATABASE_URL}"

if [ -z "$DB_URL" ]; then
  echo "❌ DATABASE_URL or DIRECT_URL not found in .env"
  exit 1
fi

# Clean URL (remove query params)
CLEAN_URL=$(echo "$DB_URL" | sed 's/?.*//')

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p backups

BACKUP_FILE="backups/tshastho_${TIMESTAMP}.dump"
SQL_FILE="backups/tshastho_${TIMESTAMP}.sql"

echo "📦 Starting backup..."
echo "📁 Backup location: $BACKUP_FILE"

# Use pg_dump via Supabase CLI (handles version mismatch)
if command -v npx &> /dev/null; then
  echo "Using Supabase CLI (recommended for Supabase hosted DBs)..."
  npx supabase db dump --db-url "$CLEAN_URL" -f "$SQL_FILE" 2>&1 | tail -3
  echo "✅ Backup saved: $SQL_FILE"
  ls -lh "$SQL_FILE"
else
  echo "Supabase CLI not available, using pg_dump..."
  pg_dump "$CLEAN_URL" --no-owner --no-acl --format=custom -f "$BACKUP_FILE"
  echo "✅ Backup saved: $BACKUP_FILE"
  ls -lh "$BACKUP_FILE"
fi

# Cleanup: keep only last 30 days
find backups -name "tshastho_*" -mtime +30 -delete 2>/dev/null || true

echo ""
echo "📊 Backup Summary:"
ls -lh backups/ | tail -5
