#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/db_backups"
mkdir -p $BACKUP_DIR

# Ganti dengan connection string Anda
PGPASSWORD="password_anda" pg_dump -h localhost -U postgres -d exha_wave > $BACKUP_DIR/backup_$DATE.sql

# Hapus backup lebih dari 7 hari
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete