#!/bin/bash

# Deployment Preparation Script
# This script prepares the project for deployment

set -e

echo "🚀 Preparing CMS for deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env files exist
echo -e "${YELLOW}Checking environment files...${NC}"
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}⚠️  backend/.env not found. Copying from .env.example${NC}"
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        echo -e "${GREEN}✓ Created backend/.env (please update with your values)${NC}"
    fi
fi

if [ ! -f "frontend/.env" ]; then
    echo -e "${RED}⚠️  frontend/.env not found. Copying from .env.example${NC}"
    if [ -f "frontend/.env.example" ]; then
        cp frontend/.env.example frontend/.env
        echo -e "${GREEN}✓ Created frontend/.env (please update with your values)${NC}"
    fi
fi

# Build backend
echo -e "${YELLOW}Building backend...${NC}"
cd backend
npm install
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend build successful${NC}"
else
    echo -e "${RED}✗ Backend build failed${NC}"
    exit 1
fi
cd ..

# Build frontend
echo -e "${YELLOW}Building frontend...${NC}"
cd frontend
npm install
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend build successful${NC}"
else
    echo -e "${RED}✗ Frontend build failed${NC}"
    exit 1
fi
cd ..

echo -e "${GREEN}✅ All builds successful!${NC}"
echo ""
echo "📋 Next steps:"
echo "1. Update backend/.env with your production values"
echo "2. Update frontend/.env with your production values"
echo "3. Deploy backend to Railway/Render/Fly.io"
echo "4. Deploy frontend to Vercel"
echo ""
echo "See docs/DEPLOYMENT.md for detailed instructions"

