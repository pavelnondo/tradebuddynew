#!/bin/bash

# Apple-inspired TradeBuddy Deployment Script
# Designed for efficiency and reliability

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VPS_HOST="217.151.231.249"
VPS_USER="root"
PROJECT_NAME="tradebuddy"
DEPLOY_PATH="/var/www/tradebuddy"
BACKUP_PATH="/var/backups/tradebuddy"
LOG_FILE="/tmp/tradebuddy-deploy.log"

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a $LOG_FILE
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a $LOG_FILE
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a $LOG_FILE
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "src/App.tsx" ]; then
    error "Please run this script from the TradeBuddy project root directory"
fi

# Create backup
create_backup() {
    log "Creating backup of current deployment..."
    ssh $VPS_USER@$VPS_HOST "mkdir -p $BACKUP_PATH"
    ssh $VPS_USER@$VPS_HOST "if [ -d $DEPLOY_PATH ]; then tar -czf $BACKUP_PATH/backup-$(date +%Y%m%d-%H%M%S).tar.gz -C $DEPLOY_PATH .; fi"
    log "Backup created successfully"
}

# Build frontend
build_frontend() {
    log "Building frontend..."
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        log "Installing frontend dependencies..."
        npm install
    fi
    
    # Build the application
    npm run build
    
    if [ $? -eq 0 ]; then
        log "Frontend built successfully"
    else
        error "Frontend build failed"
    fi
}

# Deploy to VPS
deploy_to_vps() {
    log "Deploying to VPS..."
    
    # Create deployment directory
    ssh $VPS_USER@$VPS_HOST "mkdir -p $DEPLOY_PATH"
    
    # Copy frontend build
    log "Copying frontend files..."
    scp -r dist/* $VPS_USER@$VPS_HOST:$DEPLOY_PATH/
    
    # Copy backend files
    log "Copying backend files..."
    scp -r backend/* $VPS_USER@$VPS_HOST:$DEPLOY_PATH/backend/
    
    # Copy configuration files
    log "Copying configuration files..."
    scp package.json $VPS_USER@$VPS_HOST:$DEPLOY_PATH/
    scp vite.config.ts $VPS_USER@$VPS_HOST:$DEPLOY_PATH/
    scp tailwind.config.ts $VPS_USER@$VPS_HOST:$DEPLOY_PATH/
    scp tsconfig.json $VPS_USER@$VPS_HOST:$DEPLOY_PATH/
    
    # Copy deployment scripts
    scp deploy-apple.sh $VPS_USER@$VPS_HOST:$DEPLOY_PATH/
    
    log "Files copied successfully"
}

# Setup VPS environment
setup_vps() {
    log "Setting up VPS environment..."
    
    # Update system
    ssh $VPS_USER@$VPS_HOST "apt update && apt upgrade -y"
    
    # Install Node.js 18 if not installed
    if ! ssh $VPS_USER@$VPS_HOST "node --version" 2>/dev/null; then
        log "Installing Node.js 18..."
        ssh $VPS_USER@$VPS_HOST "curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && apt-get install -y nodejs"
    fi
    
    # Install PostgreSQL if not installed
    if ! ssh $VPS_USER@$VPS_HOST "psql --version" 2>/dev/null; then
        log "Installing PostgreSQL..."
        ssh $VPS_USER@$VPS_HOST "apt install -y postgresql postgresql-contrib"
    fi
    
    # Install PM2 if not installed
    if ! ssh $VPS_USER@$VPS_HOST "pm2 --version" 2>/dev/null; then
        log "Installing PM2..."
        ssh $VPS_USER@$VPS_HOST "npm install -g pm2"
    fi
    
    # Install nginx if not installed
    if ! ssh $VPS_USER@$VPS_HOST "nginx -v" 2>/dev/null; then
        log "Installing nginx..."
        ssh $VPS_USER@$VPS_HOST "apt install -y nginx"
    fi
    
    log "VPS environment setup completed"
}

# Setup database
setup_database() {
    log "Setting up database..."
    
    # Create database and user
    ssh $VPS_USER@$VPS_HOST "sudo -u postgres psql -c \"CREATE DATABASE tradebuddy;\" 2>/dev/null || true"
    ssh $VPS_USER@$VPS_HOST "sudo -u postgres psql -c \"CREATE USER tradebuddy_user WITH PASSWORD 'tradebuddy_password';\" 2>/dev/null || true"
    ssh $VPS_USER@$VPS_HOST "sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE tradebuddy TO tradebuddy_user;\" 2>/dev/null || true"
    
    # Run database migrations
    log "Running database migrations..."
    ssh $VPS_USER@$VPS_HOST "cd $DEPLOY_PATH/backend && psql postgresql://tradebuddy_user:tradebuddy_password@localhost/tradebuddy -f database-schema-apple.sql"
    
    log "Database setup completed"
}

# Install backend dependencies
install_backend_deps() {
    log "Installing backend dependencies..."
    ssh $VPS_USER@$VPS_HOST "cd $DEPLOY_PATH/backend && npm install --production"
    log "Backend dependencies installed"
}

# Setup environment variables
setup_env() {
    log "Setting up environment variables..."
    
    cat > .env.production << EOF
NODE_ENV=production
PORT=3001
JWT_SECRET=$(openssl rand -base64 32)
DATABASE_URL=postgresql://tradebuddy_user:tradebuddy_password@localhost/tradebuddy
CORS_ORIGIN=https://tradebuddy.app
EOF
    
    scp .env.production $VPS_USER@$VPS_HOST:$DEPLOY_PATH/backend/.env
    rm .env.production
    
    log "Environment variables configured"
}

# Setup nginx
setup_nginx() {
    log "Setting up nginx configuration..."
    
    cat > nginx-tradebuddy.conf << EOF
server {
    listen 80;
    server_name tradebuddy.app www.tradebuddy.app;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tradebuddy.app www.tradebuddy.app;
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/tradebuddy.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tradebuddy.app/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Frontend
    location / {
        root $DEPLOY_PATH;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # File uploads
    location /uploads/ {
        alias $DEPLOY_PATH/backend/uploads/;
        expires 1d;
        add_header Cache-Control "public";
    }
}
EOF
    
    scp nginx-tradebuddy.conf $VPS_USER@$VPS_HOST:/etc/nginx/sites-available/tradebuddy
    ssh $VPS_USER@$VPS_HOST "ln -sf /etc/nginx/sites-available/tradebuddy /etc/nginx/sites-enabled/"
    ssh $VPS_USER@$VPS_HOST "nginx -t && systemctl reload nginx"
    rm nginx-tradebuddy.conf
    
    log "Nginx configuration completed"
}

# Start services
start_services() {
    log "Starting services..."
    
    # Create uploads directory
    ssh $VPS_USER@$VPS_HOST "mkdir -p $DEPLOY_PATH/backend/uploads"
    
    # Start backend with PM2
    ssh $VPS_USER@$VPS_HOST "cd $DEPLOY_PATH/backend && pm2 delete tradebuddy-api 2>/dev/null || true"
    ssh $VPS_USER@$VPS_HOST "cd $DEPLOY_PATH/backend && pm2 start app.js --name tradebuddy-api --env production"
    ssh $VPS_USER@$VPS_HOST "pm2 save && pm2 startup"
    
    log "Services started successfully"
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Wait for services to start
    sleep 5
    
    # Check if backend is responding
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        log "Backend health check passed"
    else
        error "Backend health check failed"
    fi
    
    # Check if frontend is accessible
    if curl -f http://localhost > /dev/null 2>&1; then
        log "Frontend health check passed"
    else
        error "Frontend health check failed"
    fi
    
    log "All health checks passed"
}

# Main deployment function
main() {
    log "Starting Apple-inspired TradeBuddy deployment..."
    
    # Check prerequisites
    if ! command -v ssh &> /dev/null; then
        error "SSH is required but not installed"
    fi
    
    if ! command -v npm &> /dev/null; then
        error "Node.js and npm are required but not installed"
    fi
    
    # Execute deployment steps
    create_backup
    build_frontend
    deploy_to_vps
    setup_vps
    setup_database
    install_backend_deps
    setup_env
    setup_nginx
    start_services
    health_check
    
    log "🎉 Deployment completed successfully!"
    log "🌐 Your TradeBuddy application is now live at: https://tradebuddy.app"
    log "📊 Backend API: https://tradebuddy.app/api/health"
    log "📝 Logs: ssh $VPS_USER@$VPS_HOST 'pm2 logs tradebuddy-api'"
}

# Run main function
main "$@"
