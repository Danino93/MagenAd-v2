#!/bin/bash

# ================================================
# MagenAd Production Deployment Script
# ================================================

set -e

echo "🚀 Starting deployment..."

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Backend
echo "🔧 Building backend..."
cd backend
npm install --production
cd ..

# Frontend
echo "⚛️  Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Run database migrations
echo "🗄️  Running migrations..."
echo "⚠️  Please run migrations manually in Supabase SQL Editor"
echo "   Files: db/migrations/*.sql"

# Restart services (if using PM2)
if command -v pm2 &> /dev/null; then
  echo "🔄 Restarting services..."
  pm2 restart all || pm2 start ecosystem.config.js
else
  echo "⚠️  PM2 not found. Please restart services manually"
fi

echo "✅ Deployment complete!"
echo "🌐 App running at: https://magenad.com"
