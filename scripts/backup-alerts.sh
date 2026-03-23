#!/bin/bash

# Backup all files before modification
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "Creating backup in $BACKUP_DIR"

FILES=$(grep -rl "alert(" src/ --include="*.jsx" --include="*.js" 2>/dev/null)

for FILE in $FILES; do
    cp "$FILE" "$BACKUP_DIR/"
    echo "Backed up: $FILE"
done

echo "Backup complete!"
