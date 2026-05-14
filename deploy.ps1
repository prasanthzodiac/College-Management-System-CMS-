# Deployment Preparation Script for Windows PowerShell
# This script prepares the project for deployment

$ErrorActionPreference = "Stop"

Write-Host "🚀 Preparing CMS for deployment..." -ForegroundColor Cyan

# Check if .env files exist
Write-Host "`nChecking environment files..." -ForegroundColor Yellow
if (-not (Test-Path "backend\.env")) {
    Write-Host "⚠️  backend\.env not found. Copying from .env.example" -ForegroundColor Red
    if (Test-Path "backend\.env.example") {
        Copy-Item "backend\.env.example" "backend\.env"
        Write-Host "✓ Created backend\.env (please update with your values)" -ForegroundColor Green
    }
}

if (-not (Test-Path "frontend\.env")) {
    Write-Host "⚠️  frontend\.env not found. Copying from .env.example" -ForegroundColor Red
    if (Test-Path "frontend\.env.example") {
        Copy-Item "frontend\.env.example" "frontend\.env"
        Write-Host "✓ Created frontend\.env (please update with your values)" -ForegroundColor Green
    }
}

# Build backend
Write-Host "`nBuilding backend..." -ForegroundColor Yellow
Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Backend npm install failed" -ForegroundColor Red
    Set-Location ..
    exit 1
}
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Backend build successful" -ForegroundColor Green
} else {
    Write-Host "✗ Backend build failed" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..

# Build frontend
Write-Host "`nBuilding frontend..." -ForegroundColor Yellow
Set-Location frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Frontend npm install failed" -ForegroundColor Red
    Set-Location ..
    exit 1
}
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Frontend build successful" -ForegroundColor Green
} else {
    Write-Host "✗ Frontend build failed" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..

Write-Host "`n✅ All builds successful!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Update backend/.env with your production values"
Write-Host "2. Update frontend/.env with your production values"
Write-Host "3. Deploy backend to Railway/Render/Fly.io"
Write-Host "4. Deploy frontend to Vercel"
Write-Host ""
Write-Host "See docs/DEPLOYMENT.md for detailed instructions" -ForegroundColor Cyan

