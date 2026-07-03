# Reuses the official mongo image purely for its bundled mongodump/mongorestore
# binaries — this container never runs mongod itself.
FROM mongo:7

COPY backup.sh /usr/local/bin/backup.sh
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/backup.sh /usr/local/bin/entrypoint.sh

ENTRYPOINT ["entrypoint.sh"]
