# TradeBuddy Local Development Setup

This guide will help you set up TradeBuddy to run locally with your PostgreSQL database.

## Prerequisites

1. **PostgreSQL** installed and running locally
   - On macOS: `brew install postgresql && brew services start postgresql`
   - On Ubuntu/Debian: `sudo apt install postgresql postgresql-contrib`
   - On Windows: Download from [postgresql.org](https://www.postgresql.org/download/)

2. **Node.js** (version 18 or higher)
   - Download from [nodejs.org](https://nodejs.org/)

3. **npm** or **yarn** package manager

## Database Setup

### Option 1: Automatic Setup (Recommended)

Run the setup script from the backend directory:

```bash
cd backend
npm run setup-local
```

This will:
- Create the `tradebuddy` database
- Set up all required tables and indexes
- Configure triggers and constraints

### Option 2: Manual Setup

1. Create the database:
```bash
createdb -h localhost -U postgres tradebuddy
```

2. Run the schema setup:
```bash
psql -h localhost -U postgres -d tradebuddy -f backend/setup-local-db.sql
```

## Configuration

The application is already configured for local development:

- **Database**: `postgresql://postgres:your_db_password_here@localhost:5432/tradebuddy`
- **Backend API**: `http://localhost:3000`
- **Frontend**: `http://localhost:5173`

## Running the Application

### 1. Start the Backend

```bash
cd backend
npm install
npm run dev
```

The backend will start on `http://localhost:3000`

### 2. Start the Frontend

In a new terminal:

```bash
npm install
npm run dev
```

The frontend will start on `http://localhost:5173`

## Database Connection Details

- **Host**: localhost
- **Port**: 5432
- **Database**: tradebuddy
- **Username**: postgres
- **Password**: your_db_password_here

## Troubleshooting

### PostgreSQL Connection Issues

1. **Check if PostgreSQL is running**:
   ```bash
   pg_isready -h localhost -p 5432
   ```

2. **Start PostgreSQL**:
   - macOS: `brew services start postgresql`
   - Ubuntu/Debian: `sudo systemctl start postgresql`

3. **Check PostgreSQL logs** for connection issues

### Database Permission Issues

If you get permission errors, make sure the `postgres` user has the correct permissions:

```bash
# Connect as postgres superuser
psql -h localhost -U postgres

# Grant permissions
GRANT ALL PRIVILEGES ON DATABASE tradebuddy TO postgres;
```

### Port Conflicts

If ports 3000 or 5173 are already in use:

1. **Backend port**: Change `PORT=3000` in `backend/.env`
2. **Frontend port**: Change the port in `vite.config.ts`

## Development Tips

1. **Database Reset**: To reset the database, drop and recreate it:
   ```bash
   dropdb -h localhost -U postgres tradebuddy
   npm run setup-local
   ```

2. **View Database**: Use a GUI tool like pgAdmin or DBeaver to inspect your data

3. **Logs**: Backend logs are shown in the terminal where you run `npm run dev`

4. **Hot Reload**: Both frontend and backend support hot reload during development

## Next Steps

Once everything is running:

1. Open `http://localhost:5173` in your browser
2. Create a new account or log in
3. Start adding your trades!

## Support

If you encounter any issues:

1. Check the console logs in both frontend and backend terminals
2. Verify PostgreSQL is running and accessible
3. Ensure all environment variables are set correctly
4. Check that all dependencies are installed (`npm install` in both directories)

