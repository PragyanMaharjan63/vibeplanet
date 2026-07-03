#!/bin/bash
set -euo pipefail

INTERVAL_SECONDS="${BACKUP_INTERVAL_SECONDS:-86400}"
echo "[backup] service started — every ${INTERVAL_SECONDS}s, keeping ${BACKUP_RETENTION_DAYS:-7} days"

while true; do
  /usr/local/bin/backup.sh || echo "[backup] run failed, will retry next cycle"
  sleep "${INTERVAL_SECONDS}"
done
