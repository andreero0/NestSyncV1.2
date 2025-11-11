#!/bin/bash

# Simple link validation script for markdown files
# Checks for broken relative links in documentation

echo "🔗 Validating markdown links..."
echo "================================"

broken_links=0
checked_files=0

# Find all markdown files in docs and archives
while IFS= read -r file; do
    ((checked_files++))
    
    # Extract markdown links [text](path)
    grep -o '\[.*\]([^)]*\.md)' "$file" 2>/dev/null | while read -r link; do
        # Extract the path from the link
        path=$(echo "$link" | sed 's/.*(\(.*\))/\1/')
        
        # Skip external links (http/https)
        if [[ "$path" =~ ^https?:// ]]; then
            continue
        fi
        
        # Get directory of current file
        dir=$(dirname "$file")
        
        # Resolve relative path
        if [[ "$path" =~ ^\.\. ]]; then
            # Relative path - resolve it
            target="$dir/$path"
        elif [[ "$path" =~ ^\. ]]; then
            # Current directory relative
            target="$dir/$path"
        elif [[ "$path" =~ ^/ ]]; then
            # Absolute path from root
            target="$path"
        else
            # Relative to current directory
            target="$dir/$path"
        fi
        
        # Normalize path (remove ..)
        target=$(cd "$(dirname "$target")" 2>/dev/null && pwd)/$(basename "$target") 2>/dev/null
        
        # Check if file exists
        if [ ! -f "$target" ]; then
            echo "❌ Broken link in $file:"
            echo "   Link: $path"
            echo "   Resolved to: $target"
            echo ""
            ((broken_links++))
        fi
    done
done < <(find docs -name "*.md" -type f 2>/dev/null)

echo "================================"
echo "📊 Results:"
echo "   Files checked: $checked_files"
echo "   Broken links: $broken_links"

if [ $broken_links -eq 0 ]; then
    echo "✅ All links are valid!"
    exit 0
else
    echo "⚠️  Found $broken_links broken link(s)"
    exit 1
fi
