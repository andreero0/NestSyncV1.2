#!/bin/bash
# Generate inventory of project documentation using find

ANALYSIS_DIR=".kiro/specs/documentation-cleanup/analysis"
mkdir -p "$ANALYSIS_DIR"

echo "Generating documentation inventory..."

# Find all markdown files excluding certain directories
find . -name "*.md" -type f \
  ! -path "*/node_modules/*" \
  ! -path "*/.git/*" \
  ! -path "*/venv/*" \
  ! -path "*/__pycache__/*" \
  ! -path "*/.expo/*" \
  ! -path "*/test-results/*" \
  ! -path "*/playwright-report/*" \
  ! -path "*/backup/*" \
  ! -path "*/analysis/*" \
  ! -path "*/.temp/*" \
  ! -path "*/traces/*" \
  ! -path "*/.pytest_cache/*" \
  ! -path "*/worktrees/*" \
  | sed 's|^\./||' \
  | sort > "$ANALYSIS_DIR/file-list.txt"

TOTAL=$(wc -l < "$ANALYSIS_DIR/file-list.txt" | tr -d ' ')

echo "✓ Found $TOTAL markdown files"
echo "✓ File list saved to: $ANALYSIS_DIR/file-list.txt"

# Count by directory
echo ""
echo "Distribution by top-level directory:"
cat "$ANALYSIS_DIR/file-list.txt" | awk -F'/' '{print $1}' | sort | uniq -c | sort -rn

# Identify migration candidates
echo ""
echo "Identifying migration candidates..."

# Root-level reports
grep -E '^[^/]+\.(md)$' "$ANALYSIS_DIR/file-list.txt" | \
  grep -iE '(FIX|IMPLEMENTATION|REPORT|STATUS|COMPLETE)' > "$ANALYSIS_DIR/root-reports.txt" || true

# Backend reports  
grep '^NestSync-backend/' "$ANALYSIS_DIR/file-list.txt" | \
  grep -v '^NestSync-backend/docs/' | \
  grep -iE '(IMPLEMENTATION|REPORT|STATUS|COMPLETE|GUIDE)' > "$ANALYSIS_DIR/backend-reports.txt" || true

# Frontend reports
grep '^NestSync-frontend/' "$ANALYSIS_DIR/file-list.txt" | \
  grep -v '^NestSync-frontend/docs/' | \
  grep -iE '(IMPLEMENTATION|REPORT|STATUS|COMPLETE|FIX|TEST)' > "$ANALYSIS_DIR/frontend-reports.txt" || true

ROOT_COUNT=$(wc -l < "$ANALYSIS_DIR/root-reports.txt" | tr -d ' ')
BACKEND_COUNT=$(wc -l < "$ANALYSIS_DIR/backend-reports.txt" | tr -d ' ')
FRONTEND_COUNT=$(wc -l < "$ANALYSIS_DIR/frontend-reports.txt" | tr -d ' ')

echo "✓ Root-level reports: $ROOT_COUNT"
echo "✓ Backend reports: $BACKEND_COUNT"
echo "✓ Frontend reports: $FRONTEND_COUNT"

echo ""
echo "Analysis complete! Review files in: $ANALYSIS_DIR"
