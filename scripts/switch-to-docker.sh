#!/bin/bash

# Quick Switch to Docker Development Mode
# Simple script for rapid environment switching without starting services

set -e

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEV_SCRIPT="$PROJECT_ROOT/dev.sh"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Quick Switch to Docker Mode${NC}"
echo "=================================="

# Check if master dev script exists
if [ ! -f "$DEV_SCRIPT" ]; then
    echo "❌ Master dev script not found: $DEV_SCRIPT"
    exit 1
fi

# Execute the switch
"$DEV_SCRIPT" switch docker --force

echo ""
echo -e "${GREEN}✅ Successfully switched to Docker development mode${NC}"
echo -e "${BLUE}ℹ️  To start services: ./dev.sh docker start${NC}"
echo -e "${BLUE}ℹ️  To check status: ./dev.sh status${NC}"