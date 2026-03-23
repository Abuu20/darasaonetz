#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔧 Replacing alerts with toast notifications...${NC}\n"

# Find all JSX/JS files with alerts
FILES=$(grep -rl "alert(" src/ --include="*.jsx" --include="*.js" 2>/dev/null)

for FILE in $FILES; do
    echo -e "${GREEN}Processing:${NC} $FILE"
    
    # Check if useTheme is already imported
    if ! grep -q "useTheme" "$FILE"; then
        # Add useTheme import at the top of the file
        sed -i '1s/^/import { useTheme } from '"'"'..\/..\/context\/ThemeContext'"'"'\n/' "$FILE"
        sed -i '1s/^/import { useTheme } from '"'"'..\/context\/ThemeContext'"'"'\n/' "$FILE"
        sed -i '1s/^/import { useTheme } from '"'"'.\/context\/ThemeContext'"'"'\n/' "$FILE"
        echo -e "  ${YELLOW}→ Added useTheme import${NC}"
    fi
    
    # Add toast destructuring after the component function starts
    # Find where to add: after the first { or after useState
    if grep -q "const { show" "$FILE"; then
        echo -e "  ${GREEN}→ Toast methods already present${NC}"
    else
        # Add after the component function opening
        sed -i '/export default function.*{/a \  const { showSuccess, showError, showWarning, showInfo } = useTheme()' "$FILE"
        echo -e "  ${GREEN}→ Added toast methods${NC}"
    fi
    
    # Replace alerts with appropriate toast methods
    # Success alerts (🎉, ✓, success)
    sed -i 's/alert(\(.*🎉.*\))/showSuccess(\1)/g' "$FILE"
    sed -i 's/alert(\(.*successfully.*\))/showSuccess(\1)/g' "$FILE"
    sed -i 's/alert(\(.*✅.*\))/showSuccess(\1)/g' "$FILE"
    
    # Error alerts (failed, error, ❌)
    sed -i 's/alert(\(.*failed.*\))/showError(\1)/g' "$FILE"
    sed -i 's/alert(\(.*error.*\))/showError(\1)/g' "$FILE"
    sed -i 's/alert(\(.*❌.*\))/showError(\1)/g' "$FILE"
    
    # Warning alerts (please, caution)
    sed -i 's/alert(\(.*please.*\))/showWarning(\1)/g' "$FILE"
    sed -i 's/alert(\(.*Please.*\))/showWarning(\1)/g' "$FILE"
    
    # Info alerts (🛒, 📝, general info)
    sed -i 's/alert(\(.*🛒.*\))/showInfo(\1)/g' "$FILE"
    sed -i 's/alert(\(.*📝.*\))/showInfo(\1)/g' "$FILE"
    sed -i 's/alert(\(.*🔔.*\))/showInfo(\1)/g' "$FILE"
    
    # Default - use showInfo for remaining alerts
    sed -i 's/alert(/showInfo(/g' "$FILE"
    
    echo -e "  ${GREEN}✓ Completed${NC}\n"
done

echo -e "${GREEN}✅ All alerts replaced with toast notifications!${NC}"
echo -e "${YELLOW}⚠️  Please review changes and test the app${NC}"
