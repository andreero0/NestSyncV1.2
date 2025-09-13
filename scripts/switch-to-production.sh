#!/bin/bash

# Quick Switch to Production-Connected Development Mode
# Simple script for rapid environment switching without starting services
# ⚠️  WARNING: This connects to PRODUCTION services!

set -e

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEV_SCRIPT="$PROJECT_ROOT/dev.sh"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${RED}🚨 Quick Switch to Production Mode${NC}"
echo "===================================="
echo -e "${RED}⚠️  WARNING: This connects to REAL production data!${NC}"
echo ""

# Check if master dev script exists
if [ ! -f "$DEV_SCRIPT" ]; then
    echo "❌ Master dev script not found: $DEV_SCRIPT"
    exit 1
fi

# Show warning and get confirmation
echo -e "${YELLOW}This will switch your environment to connect to production services.${NC}"
echo -e "${YELLOW}Make sure you understand the implications before proceeding.${NC}"
echo ""

read -p "Continue with production mode switch? (y/N): " -r
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Switch cancelled."
    exit 0
fi

# Execute the switch
"$DEV_SCRIPT" switch production --force

echo ""
echo -e "${GREEN}✅ Successfully switched to production-connected development mode${NC}"
echo -e "${RED}⚠️  You are now configured to use PRODUCTION services!${NC}"
echo ""
echo -e "${BLUE}ℹ️  To start services: ./dev.sh production start${NC}"
echo -e "${BLUE}ℹ️  To check status: ./dev.sh status${NC}"
echo -e "${BLUE}ℹ️  To switch back to Docker: ./scripts/switch-to-docker.sh${NC}"