#!/bin/bash
# Database Restore Script (DANGER: overwrites current DB)
# Usage: ./scripts/restore-db.sh backups/tshastho_YYYYMMDD_HHMMSS.sql

set -e

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
  echo "❌ Usage: ./scripts/restore-db.sh <backup-file>"
  echo ""
  echo "Available backups:"
  ls -lh backups/ 2>/dev/null || echo "  (none)"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "⚠️  WARNING: This will OVERWRITE the current database!"
echo "📁 Backup file: $BACKUP_FILE"
echo ""
read -p "Type 'RESTORE' to confirm: " confirm

if [ "$confirm" != "RESTORE" ]; then
  echo "❌ Cancelled"
  exit 1
fi

# Load env
if [ -f .env ]; then
  export $(grep -v '^#' .env | grep DATABASE_URL | xargs)
  export $(grep -v '^#' .env | grep DIRECT_URL | xargs)
fi

DB_URL="${DIRECT_URL:-$DATABASE_URL}"
CLEAN_URL=$(echo "$DB_URL" | sed 's/?.*//')

echo "🔄 Restoring..."
if [[ "$BACKUP_FILE" == *.sql ]]; then
  psql "$CLEAN_URL" -f "$BACKUP_FILE"
else
  pg_restore --clean --no-owner --no-acl -d "$CLEAN_URL" "$BACKUP_FILE"
fi

echo "✅ Restore complete!"
