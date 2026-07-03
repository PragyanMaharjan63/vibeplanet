#!/bin/bash
set -euo pipefail

STAMP=$(date +%Y%m%d-%H%M%S)
FILE="/backups/web1-${STAMP}.archive.gz"

echo "[backup] $(date -Iseconds) starting dump -> ${FILE}"
mongodump --uri="${MONGO_URI}" --archive="${FILE}" --gzip
echo "[backup] $(date -Iseconds) dump complete"

RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
echo "[backup] pruning dumps older than ${RETENTION_DAYS} days"
find /backups -name 'web1-*.archive.gz' -mtime "+${RETENTION_DAYS}" -print -delete
