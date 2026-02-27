# TradeBuddy Installation Guide for macOS

This guide will help you install all the necessary tools to run TradeBuddy locally on macOS.

## Step 1: Install Homebrew (Package Manager)

Homebrew is the easiest way to install development tools on macOS.

1. Open Terminal (Applications > Utilities > Terminal)
2. Run this command to install Homebrew:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

3. Follow the prompts and enter your password when asked
4. After installation, add Homebrew to your PATH by running:

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
source ~/.zshrc
```

## Step 2: Install Node.js and npm

```bash
brew install node
```

This will install both Node.js and npm. Verify the installation:

```bash
node --version
npm --version
```

## Step 3: Install PostgreSQL

```bash
brew install postgresql@15
```

Start PostgreSQL service:

```bash
brew services start postgresql@15
```

## Step 4: Set up PostgreSQL User and Database

1. Create a PostgreSQL superuser (if it doesn't exist):

```bash
createuser -s postgres
```

2. Set a password for the postgres user:

```bash
psql postgres
```

In the PostgreSQL prompt, run:

```sql
ALTER USER postgres PASSWORD 'YOUR_DB_PASSWORD';
\q
```

## Step 5: Install Project Dependencies

1. Navigate to the project directory:

```bash
cd /Users/pavelnondo/tradebuddynew
```

2. Install frontend dependencies:

```bash
npm install
```

3. Install backend dependencies:

```bash
cd backend
npm install
cd ..
```

## Step 6: Set up the Database

Run the database setup script:

```bash
cd backend
npm run setup-local
```

## Step 7: Start the Application

### Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

### Terminal 2 - Frontend:
```bash
npm run dev
```

## Step 8: Access the Application

Open your browser and go to: `http://localhost:5173`

## Troubleshooting

### If Homebrew installation fails:

1. Make sure you have Xcode Command Line Tools installed:
```bash
xcode-select --install
```

2. Try installing Homebrew with the alternative method:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### If PostgreSQL won't start:

1. Check if it's already running:
```bash
brew services list | grep postgresql
```

2. If it's stopped, start it:
```bash
brew services start postgresql@15
```

3. Check PostgreSQL logs:
```bash
brew services info postgresql@15
```

### If you get permission errors:

1. Make sure the postgres user exists:
```bash
psql postgres -c "\du"
```

2. If not, create it:
```bash
createuser -s postgres
```

### If ports are already in use:

1. Check what's using port 3000:
```bash
lsof -i :3000
```

2. Check what's using port 5173:
```bash
lsof -i :5173
```

3. Kill the processes if needed:
```bash
kill -9 <PID>
```

## Alternative Installation Methods

### Using MacPorts instead of Homebrew:

1. Install MacPorts from [macports.org](https://www.macports.org/)
2. Install packages:
```bash
sudo port install nodejs18 postgresql15
```

### Using PostgreSQL.app:

1. Download from [postgresapp.com](https://postgresapp.com/)
2. Install and start the app
3. The default user will be your macOS username

## Verification

After installation, verify everything is working:

1. **Node.js**: `node --version` (should show v18+)
2. **npm**: `npm --version` (should show v8+)
3. **PostgreSQL**: `psql --version` (should show 15+)
4. **Database connection**: `psql -h localhost -U postgres -d tradebuddy`

## Next Steps

Once everything is installed and running:

1. Create your first account in the app
2. Start adding trades to your journal
3. Explore the analytics and features

## Getting Help

If you encounter issues:

1. Check the console logs in both terminal windows
2. Verify all services are running
3. Make sure all dependencies are installed
4. Check the LOCAL_SETUP.md file for additional troubleshooting

## Uninstalling

If you need to remove everything:

```bash
# Stop services
brew services stop postgresql@15

# Uninstall packages
brew uninstall postgresql@15 node

# Remove Homebrew (optional)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/uninstall.sh)"
```

