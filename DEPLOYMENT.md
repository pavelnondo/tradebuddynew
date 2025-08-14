## Dockerized Deployment (Non-conflicting ports)

This project can be deployed with Nginx as a reverse proxy on 8091, a Node.js backend on 4004 (internal), and PostgreSQL on 5440.

Exposed ports used by this stack:
- 8091/tcp: Public entry via Nginx (serves frontend; proxies /api and /public to backend)
- 4004/tcp: Backend service (internal; not exposed publicly)
- 5440/tcp: PostgreSQL (optional external access)

Optional and not exposed by default:
- 5173/tcp: Frontend dev server
- 5679/tcp: Direct backend exposure (debug)
- 5433/tcp: Previous Postgres mapping

### Steps
1. Create `.env` files:
   - `backend/.env` based on `backend/config.env.example`
   - set `PORT=4004`, `PGPORT=5440`, `JWT_SECRET`, DB creds
2. Build frontend: `npm ci && npm run build`
3. Start services via Docker Compose (see `docker-compose.yml`).
4. Access app at http://your-server:8091

Nginx proxies `/api/*` to backend and serves the SPA. Uploads under `/public/lovable-uploads` are also proxied from backend.
# TradeBuddy Deployment Guide

This guide explains how to deploy updates to your VPS from GitHub.

## Prerequisites

- SSH access to your VPS (217.151.231.249)
- Git repository set up on GitHub
- Node.js and npm installed on VPS
- PM2 installed on VPS (for process management)

## Quick Deployment

### Option 1: Using PowerShell Script (Windows)
```powershell
.\deploy.ps1
```

### Option 2: Using Bash Script (Linux/Mac)
```bash
chmod +x deploy.sh
./deploy.sh
```

### Option 3: Manual Deployment

1. **SSH into your VPS:**
   ```bash
   ssh root@217.151.231.249
   ```

2. **Navigate to project directory:**
   ```bash
   cd /root/tradebuddynew
   ```

3. **Pull latest changes:**
   ```bash
   git fetch origin
   git reset --hard origin/main
   ```

4. **Install dependencies:**
   ```bash
   # Backend dependencies
   cd backend
   npm install
   cd ..
   
   # Frontend dependencies
   npm install
   ```

5. **Build frontend:**
   ```bash
   npm run build
   ```

6. **Restart services:**
   ```bash
   # Restart backend with PM2
   pm2 restart tradebuddy-backend
   
   # Reload nginx (if using)
   nginx -s reload
   ```

## What the Deployment Script Does

1. **Checks if project exists** - If not, clones from GitHub
2. **Updates code** - Pulls latest changes from main branch
3. **Installs dependencies** - Updates both backend and frontend packages
4. **Builds frontend** - Creates production build
5. **Restarts services** - Restarts backend and reloads web server

## Troubleshooting

### If PM2 is not installed:
```bash
npm install -g pm2
pm2 start backend/index.js --name tradebuddy-backend
```

### If nginx is not installed:
```bash
apt update
apt install nginx
```

### Check service status:
```bash
pm2 status
pm2 logs tradebuddy-backend
```

## Environment Variables

Make sure your VPS has the necessary environment variables set up in `/root/tradebuddynew/backend/.env`:

- Database credentials
- API keys
- Telegram bot token
- Other configuration variables

## Monitoring

After deployment, check:
- Backend logs: `pm2 logs tradebuddy-backend`
- Frontend access: Visit your domain/IP
- Database connectivity
- Telegram bot functionality

## Rollback

If something goes wrong, you can rollback to a previous commit:
```bash
ssh root@217.151.231.249
cd /root/tradebuddynew
git log --oneline -5  # Find the commit to rollback to
git reset --hard <commit-hash>
# Then restart services
pm2 restart tradebuddy-backend
``` 