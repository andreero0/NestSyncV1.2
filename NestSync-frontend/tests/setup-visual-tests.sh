#!/bin/bash

# Visual Regression Test Setup Script
# This script prepares the environment for running visual regression tests

set -e

echo "🎨 Setting up Visual Regression Test Environment"
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Must be run from NestSync-frontend directory${NC}"
    exit 1
fi

# Check if Playwright is installed
echo -e "\n${YELLOW}📦 Checking Playwright installation...${NC}"
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ Error: npx not found. Please install Node.js${NC}"
    exit 1
fi

# Install Playwright browsers if needed
echo -e "\n${YELLOW}🌐 Installing Playwright browsers...${NC}"
npx playwright install chromium webkit

# Create test results directory
echo -e "\n${YELLOW}📁 Creating test results directory...${NC}"
mkdir -p test-results/visual-regression
mkdir -p test-results/visual-regression-report

# Check if frontend server is running
echo -e "\n${YELLOW}🔍 Checking if frontend server is running...${NC}"
if curl -s http://localhost:8082 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend server is running${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend server is not running${NC}"
    echo -e "${YELLOW}   Please start it with: npm run start${NC}"
fi

# Check if backend server is running
echo -e "\n${YELLOW}🔍 Checking if backend server is running...${NC}"
if curl -s http://localhost:8001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend server is running${NC}"
else
    echo -e "${YELLOW}⚠️  Backend server is not running${NC}"
    echo -e "${YELLOW}   Please start it from NestSync-backend with:${NC}"
    echo -e "${YELLOW}   source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8001 --reload${NC}"
fi

echo -e "\n${GREEN}✅ Visual regression test environment is ready!${NC}"
echo -e "\n${YELLOW}📝 Next steps:${NC}"
echo -e "   1. Ensure both frontend and backend servers are running"
echo -e "   2. Run tests with: npm run test:visual"
echo -e "   3. View results with: npm run test:visual:report"
echo -e "\n${YELLOW}📚 For more information, see:${NC}"
echo -e "   tests/VISUAL_REGRESSION_TESTS.md"
echo ""
