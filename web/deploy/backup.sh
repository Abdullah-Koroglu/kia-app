#!/usr/bin/env sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKUP_DIR:?BACKUP_DIR is required}"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$BACKUP_DIR"
pg_dump --format=custom --no-owner --no-acl \
  --file="$BACKUP_DIR/qiraat_atlas_$timestamp.dump" \
  "$DATABASE_URL"

find "$BACKUP_DIR" -type f -name 'qiraat_atlas_*.dump' -mtime +30 -delete

