#!/bin/bash
# backup.sh - Automated Database Backup Script
# MagenAd Production Backup System

set -e

# ============================================
# Configuration
# ============================================
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_BACKUP_FILE="magenad_db_${TIMESTAMP}.sql"
REDIS_BACKUP_FILE="magenad_redis_${TIMESTAMP}.rdb"
COMPRESSED_FILE="magenad_backup_${TIMESTAMP}.tar.gz"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================
# Functions
# ============================================

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if required environment variables are set
check_env() {
    local required_vars=("DB_HOST" "DB_USER" "DB_PASSWORD" "DB_NAME")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        error "Missing required environment variables: ${missing_vars[*]}"
        exit 1
    fi
}

# Backup PostgreSQL database
backup_database() {
    log "Starting database backup..."
    
    export PGPASSWORD="$DB_PASSWORD"
    
    if pg_dump -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" \
        --format=custom \
        --compress=9 \
        --verbose \
        --file="${BACKUP_DIR}/${DB_BACKUP_FILE}.dump" 2>&1; then
        log "Database backup completed: ${DB_BACKUP_FILE}.dump"
        
        # Also create SQL dump for easier inspection
        pg_dump -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" \
            > "${BACKUP_DIR}/${DB_BACKUP_FILE}"
        
        log "SQL backup created: ${DB_BACKUP_FILE}"
    else
        error "Database backup failed!"
        return 1
    fi
    
    unset PGPASSWORD
}

# Backup Redis data
backup_redis() {
    log "Starting Redis backup..."
    
    if command -v redis-cli &> /dev/null; then
        redis-cli -h "${REDIS_HOST:-redis}" -p "${REDIS_PORT:-6379}" \
            -a "$REDIS_PASSWORD" --rdb "${BACKUP_DIR}/${REDIS_BACKUP_FILE}" 2>&1
        log "Redis backup completed: ${REDIS_BACKUP_FILE}"
    else
        warning "redis-cli not found, skipping Redis backup"
    fi
}

# Compress backups
compress_backups() {
    log "Compressing backups..."
    
    cd "$BACKUP_DIR"
    tar -czf "$COMPRESSED_FILE" \
        "${DB_BACKUP_FILE}.dump" \
        "${DB_BACKUP_FILE}" \
        "${REDIS_BACKUP_FILE}" 2>/dev/null || true
    
    log "Backup compressed: ${COMPRESSED_FILE}"
    
    # Calculate size
    SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
    log "Compressed size: $SIZE"
}

# Upload to S3 (if configured)
upload_to_s3() {
    if [ -n "$S3_BUCKET" ] && command -v aws &> /dev/null; then
        log "Uploading to S3: s3://${S3_BUCKET}/backups/"
        
        aws s3 cp "${BACKUP_DIR}/${COMPRESSED_FILE}" \
            "s3://${S3_BUCKET}/backups/${COMPRESSED_FILE}" \
            --region "${AWS_REGION:-us-east-1}" \
            --storage-class STANDARD_IA
        
        log "Upload to S3 completed"
    else
        warning "S3 upload skipped (bucket not configured or AWS CLI not available)"
    fi
}

# Clean old backups
cleanup_old_backups() {
    local retention_days=${BACKUP_RETENTION_DAYS:-30}
    log "Cleaning backups older than ${retention_days} days..."
    
    find "$BACKUP_DIR" -name "magenad_backup_*.tar.gz" -mtime +${retention_days} -delete
    find "$BACKUP_DIR" -name "magenad_db_*.sql*" -mtime +${retention_days} -delete
    find "$BACKUP_DIR" -name "magenad_redis_*.rdb" -mtime +${retention_days} -delete
    
    log "Old backups cleaned"
    
    # Clean old S3 backups
    if [ -n "$S3_BUCKET" ] && command -v aws &> /dev/null; then
        local cutoff_date=$(date -d "${retention_days} days ago" +%Y-%m-%d)
        aws s3 ls "s3://${S3_BUCKET}/backups/" | \
            awk '{print $4}' | \
            while read file; do
                file_date=$(echo "$file" | grep -oP '\d{8}' | head -1)
                if [[ "$file_date" < "${cutoff_date//[-]/}" ]]; then
                    aws s3 rm "s3://${S3_BUCKET}/backups/$file"
                    log "Deleted old S3 backup: $file"
                fi
            done
    fi
}

# Verify backup integrity
verify_backup() {
    log "Verifying backup integrity..."
    
    if [ -f "${BACKUP_DIR}/${COMPRESSED_FILE}" ]; then
        if tar -tzf "${BACKUP_DIR}/${COMPRESSED_FILE}" > /dev/null 2>&1; then
            log "Backup integrity verified ✓"
        else
            error "Backup verification failed!"
            return 1
        fi
    fi
}

# Send notification
send_notification() {
    local status=$1
    local message=$2
    
    if [ -n "$SLACK_WEBHOOK" ]; then
        local emoji=":white_check_mark:"
        local color="good"
        
        if [ "$status" = "error" ]; then
            emoji=":x:"
            color="danger"
        fi
        
        curl -X POST "$SLACK_WEBHOOK" \
            -H 'Content-Type: application/json' \
            -d @- << EOF
{
    "attachments": [{
        "color": "$color",
        "title": "MagenAd Backup $status",
        "text": "$message",
        "footer": "Backup System",
        "ts": $(date +%s)
    }]
}
EOF
    fi
}

# ============================================
# Main Backup Process
# ============================================
main() {
    log "========================================="
    log "MagenAd Backup Script Starting"
    log "========================================="
    
    # Check environment
    check_env
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    # Perform backups
    if backup_database && backup_redis; then
        compress_backups
        verify_backup
        upload_to_s3
        cleanup_old_backups
        
        log "========================================="
        log "Backup completed successfully!"
        log "========================================="
        
        send_notification "success" "Backup completed: ${COMPRESSED_FILE}"
        exit 0
    else
        error "Backup failed!"
        send_notification "error" "Backup failed - check logs"
        exit 1
    fi
}

# ============================================
# Restore Function (for manual use)
# ============================================
restore_backup() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        error "Usage: $0 restore <backup_file>"
        exit 1
    fi
    
    log "Restoring from backup: $backup_file"
    
    # Extract backup
    tar -xzf "$backup_file" -C "$BACKUP_DIR"
    
    # Restore database
    export PGPASSWORD="$DB_PASSWORD"
    
    # Find the .dump file
    local dump_file=$(tar -tzf "$backup_file" | grep "\.dump$" | head -1)
    
    if [ -n "$dump_file" ]; then
        log "Restoring database from: $dump_file"
        pg_restore -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" \
            -d "$DB_NAME" --clean --if-exists \
            "${BACKUP_DIR}/${dump_file}"
        
        log "Database restored successfully"
    else
        error "No database dump found in backup"
    fi
    
    unset PGPASSWORD
    
    log "Restore completed"
}

# ============================================
# Entry Point
# ============================================
case "${1:-backup}" in
    backup)
        main
        ;;
    restore)
        restore_backup "$2"
        ;;
    *)
        echo "Usage: $0 {backup|restore <backup_file>}"
        exit 1
        ;;
esac
