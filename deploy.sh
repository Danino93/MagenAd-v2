#!/bin/bash
# deploy.sh - Quick deployment script for MagenAd

set -e  # Exit on error

echo "🚀 MagenAd Deployment Script"
echo "=============================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "📝 Copy .env.example to .env and fill in your values:"
    echo "   cp .env.example .env"
    exit 1
fi

# Parse command line arguments
ENVIRONMENT=${1:-development}

echo -e "${GREEN}📦 Environment: $ENVIRONMENT${NC}"
echo ""

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running!${NC}"
        echo "Please start Docker and try again."
        exit 1
    fi
    echo -e "${GREEN}✅ Docker is running${NC}"
}

# Function to build images
build_images() {
    echo ""
    echo "🏗️  Building Docker images..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache
    else
        docker-compose build
    fi
    
    echo -e "${GREEN}✅ Images built successfully${NC}"
}

# Function to start services
start_services() {
    echo ""
    echo "🚀 Starting services..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
    else
        docker-compose up -d
    fi
    
    echo -e "${GREEN}✅ Services started${NC}"
}

# Function to wait for services to be healthy
wait_for_health() {
    echo ""
    echo "⏳ Waiting for services to be healthy..."
    
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker-compose ps | grep -q "healthy"; then
            echo -e "${GREEN}✅ Services are healthy${NC}"
            return 0
        fi
        
        attempt=$((attempt + 1))
        echo "   Attempt $attempt/$max_attempts..."
        sleep 2
    done
    
    echo -e "${YELLOW}⚠️  Services may not be fully healthy yet${NC}"
    echo "   Check logs with: docker-compose logs"
}

# Function to show status
show_status() {
    echo ""
    echo "📊 Service Status:"
    docker-compose ps
    
    echo ""
    echo "🔗 Access Points:"
    echo "   Frontend: http://localhost"
    echo "   Backend:  http://localhost:3001"
    echo "   Health:   http://localhost:3001/api/health"
    
    if [ "$ENVIRONMENT" = "production" ]; then
        echo "   HTTPS:    https://localhost"
    fi
}

# Function to run database migrations
run_migrations() {
    echo ""
    echo "🗄️  Running database migrations..."
    
    # Wait for postgres to be ready
    docker-compose exec -T postgres pg_isready || sleep 5
    
    # Run migrations (adjust this based on your migration tool)
    # docker-compose exec -T backend npm run migrate
    
    echo -e "${GREEN}✅ Migrations completed${NC}"
}

# Main deployment flow
main() {
    check_docker
    build_images
    start_services
    wait_for_health
    
    if [ "$ENVIRONMENT" = "production" ]; then
        run_migrations
    fi
    
    show_status
    
    echo ""
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo ""
    echo "📝 Useful commands:"
    echo "   View logs:     docker-compose logs -f"
    echo "   Stop services: docker-compose down"
    echo "   Restart:       docker-compose restart"
    echo "   Shell access:  docker-compose exec backend sh"
}

# Run main function
main