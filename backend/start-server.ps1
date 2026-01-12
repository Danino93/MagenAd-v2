# PowerShell script to start the server and show output
Write-Host "🚀 Starting Backend Server..." -ForegroundColor Green
Write-Host ""

cd $PSScriptRoot

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  node_modules not found. Running npm install..." -ForegroundColor Yellow
    npm install
}

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  .env.local not found!" -ForegroundColor Red
    Write-Host "Please create .env.local with required variables" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Starting server..." -ForegroundColor Green
Write-Host ""

# Start the server
node server.js
