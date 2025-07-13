# Fix for Current Setup - Backend Communication Issue

## Current Status
- ✅ Frontend: Working on port 8080 (http://mytradebuddy.ru:8080/)
- ✅ Backend: Running on port 3000 (PM2 process)
- ❌ API Communication: Failing (frontend can't fetch data from backend)

## Root Cause
The frontend is trying to connect to `http://217.151.231.249:4004` but the backend is actually running on port 3000, and Nginx isn't properly configured to proxy API requests.

## Solution

### 1. Update Frontend Configuration (Already Done)
The frontend config has been updated to use `http://mytradebuddy.ru/api` instead of the direct port.

### 2. Update Nginx Configuration on VPS

SSH into your VPS and run:

```bash
# Copy the new Nginx configuration
cp nginx-config-current.txt /etc/nginx/sites-available/mytradebuddy.ru

# Test the configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

### 3. Verify Backend is Running on Port 3000

```bash
# Check PM2 processes
pm2 list

# Check what's listening on port 3000
ss -tuln | grep 3000

# Test backend directly
curl http://localhost:3000/trades
```

### 4. Test the Fix

```bash
# Test API through Nginx
curl http://mytradebuddy.ru/api/trades

# Test frontend
curl http://mytradebuddy.ru/
```

### 5. Build and Deploy Frontend

On your local machine:
```bash
# Build the frontend
npm run build

# Upload to VPS
scp -r dist/ root@217.151.231.249:/root/tradebuddynew/
```

## Expected Result
After these changes:
- Frontend loads at http://mytradebuddy.ru/ (port 80)
- API calls work: http://mytradebuddy.ru/api/trades
- No more "Failed to fetch" errors
- Trades data loads properly

## Troubleshooting

### If API calls still fail:
1. Check backend is running: `pm2 list`
2. Check backend port: `ss -tuln | grep 3000`
3. Test backend directly: `curl http://localhost:3000/trades`
4. Check Nginx logs: `tail -f /var/log/nginx/error.log`

### If frontend doesn't load:
1. Check frontend server: `ps aux | grep serve`
2. Check port 8080: `ss -tuln | grep 8080`
3. Test frontend directly: `curl http://localhost:8080/`

## Port Configuration Summary
- **Nginx**: Port 80 (http://mytradebuddy.ru/)
- **Frontend**: Port 8080 (served by `serve` command)
- **Backend**: Port 3000 (PM2 process)
- **API Calls**: `/api/*` → proxied to port 3000
- **Frontend**: `/` → proxied to port 8080 