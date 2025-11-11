#!/bin/bash

# Setup Git Hooks for NestSync Frontend
# This script installs pre-commit hooks to enforce code quality

echo "Setting up Git hooks..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
  echo "❌ Error: Not in a git repository"
  exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Install pre-commit hook
echo "📝 Installing pre-commit hook..."
cat > .git/hooks/pre-commit << 'EOF'
#!/usr/bin/env sh

# Run JSX structure validation
echo "🔍 Checking JSX structure..."
node scripts/audit-jsx-violations.js --dry-run

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ JSX structure violations found!"
  echo "Run 'node scripts/fix-jsx-violations.js' to fix automatically"
  echo "Or fix manually and commit again"
  exit 1
fi

echo "✅ JSX structure check passed"

# Run ESLint
echo "🔍 Running ESLint..."
npm run lint

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ ESLint errors found!"
  echo "Fix the errors and commit again"
  exit 1
fi

echo "✅ All checks passed"
EOF

# Make the hook executable
chmod +x .git/hooks/pre-commit

echo "✅ Git hooks installed successfully!"
echo ""
echo "The following checks will run before each commit:"
echo "  1. JSX structure validation (no text in View without Text wrapper)"
echo "  2. ESLint checks"
echo ""
echo "To bypass hooks (not recommended), use: git commit --no-verify"
