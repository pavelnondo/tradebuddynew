# Trade Buddy Authentication System

## Overview

The Trade Buddy platform now includes a comprehensive authentication system that supports:
- **Web Login/Registration** - Email/password authentication
- **Telegram Integration** - Automatic user creation from Telegram
- **JWT Token Management** - Secure session handling
- **Multi-user Support** - Each user has their own data

## Features

### ✅ Implemented Features

1. **User Registration & Login**
   - Email/password registration
   - Secure password hashing (bcrypt)
   - JWT token authentication
   - Session persistence

2. **Telegram Bot Integration**
   - Automatic user creation from Telegram messages
   - Seamless authentication via Telegram ID
   - User data linking between web and Telegram

3. **Protected Routes**
   - All app routes require authentication
   - Automatic redirect to login page
   - Token validation and refresh

4. **User Management**
   - User profile display
   - Logout functionality
   - Session management

## Database Schema

### New Tables Added

```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    telegram_id BIGINT UNIQUE,
    telegram_username VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User sessions table
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Updated Tables

All existing tables now include `user_id` foreign key:
- `trades` - User-specific trade data
- `ai_analysis` - User-specific AI analysis
- `processing_logs` - User-specific processing logs
- `voice_messages` - User-specific voice data
- `document_uploads` - User-specific document uploads

## API Endpoints

### Authentication Endpoints

```typescript
// Register new user
POST /auth/register
{
  "username": "string",
  "email": "string", 
  "password": "string"
}

// Login user
POST /auth/login
{
  "email": "string",
  "password": "string"
}

// Telegram authentication
POST /auth/telegram
{
  "telegramId": "number",
  "telegramUsername": "string"
}

// Get current user
GET /auth/me
Authorization: Bearer <token>
```

### Protected Endpoints

All existing endpoints now support user authentication:
- `GET /trades` - Returns user-specific trades
- `POST /trades` - Creates trades for authenticated user
- All other endpoints filter by user_id when authenticated

## Frontend Implementation

### Authentication Flow

1. **Login Page** (`/login`)
   - Email/password login
   - User registration
   - Form validation
   - Error handling

2. **Protected Routes**
   - Automatic redirect to login
   - Loading states
   - Token validation

3. **User Interface**
   - User dropdown in header
   - Logout functionality
   - User profile display

### Key Components

- `AuthProvider` - Context for authentication state
- `ProtectedRoute` - Route protection wrapper
- `Login` - Authentication page
- `useAuth` - Authentication hook

## Telegram Bot Integration

### Automatic User Creation

When a user sends a message to the Telegram bot:
1. Bot checks if user exists by Telegram ID
2. If not, creates new user account
3. Links Telegram credentials to user account
4. Processes message with user context

### User Context in n8n

All Telegram messages now include user information:
```json
{
  "message": "...",
  "user": {
    "id": 123,
    "username": "trader_john",
    "telegram_id": 987654321
  }
}
```

## Security Features

### Password Security
- bcrypt hashing (12 salt rounds)
- Minimum 6 character requirement
- Secure password comparison

### Token Security
- JWT tokens with 7-day expiration
- Secure token verification
- Automatic token refresh
- Token invalidation on logout

### Data Isolation
- All user data filtered by user_id
- No cross-user data access
- Secure API endpoints

## Environment Variables

Add these to your `.env` file:

```env
# JWT Secret (change in production!)
JWT_SECRET=your-super-secret-jwt-key-here

# Database (existing)
PGHOST=localhost
PGUSER=tradebuddy_user
PGPASSWORD=your_db_password_here
PGDATABASE=tradebuddy
PGPORT=5432
```

## Installation & Setup

### 1. Database Migration

Run the updated schema on your VPS:

```bash
# Connect to your database
psql -d tradebuddy -f backend/database-schema.sql
```

### 2. Install Dependencies

```bash
# Backend dependencies
cd backend
npm install bcryptjs jsonwebtoken

# Frontend dependencies (already included)
cd ..
npm install
```

### 3. Environment Configuration

Update your VPS environment variables:
```bash
# Add JWT secret to your .env file
echo "JWT_SECRET=your-super-secret-jwt-key-here" >> .env
```

### 4. Restart Services

```bash
# Restart backend services
npm run dev:all
```

## Usage Examples

### Web Authentication

1. **Register**: Visit `/login` and create account
2. **Login**: Use email/password to sign in
3. **Access**: All features now user-specific

### Telegram Authentication

1. **Send Message**: Any message to Telegram bot
2. **Auto-Create**: User account created automatically
3. **Seamless**: All features work immediately

### API Usage

```typescript
// Authenticated API call
import { authenticatedFetch } from '@/lib/api';

const response = await authenticatedFetch('/trades', {
  method: 'POST',
  body: JSON.stringify(tradeData)
});
```

## Multi-User Benefits

### Data Isolation
- Each user sees only their own trades
- AI analysis is user-specific
- Voice messages and documents are private

### Scalability
- Support for unlimited users
- Efficient database queries
- Secure data access

### Telegram Integration
- Multiple users can use same bot
- Automatic user management
- Seamless cross-platform experience

## Troubleshooting

### Common Issues

1. **Token Expired**
   - Automatic redirect to login
   - Clear localStorage and re-authenticate

2. **Database Connection**
   - Check PostgreSQL connection
   - Verify environment variables

3. **Telegram Authentication**
   - Check bot token configuration
   - Verify webhook URL

### Debug Commands

```bash
# Check database tables
psql -d tradebuddy -c "\dt"

# Check users
psql -d tradebuddy -c "SELECT id, username, email FROM users;"

# Check user trades
psql -d tradebuddy -c "SELECT user_id, COUNT(*) FROM trades GROUP BY user_id;"
```

## Future Enhancements

### Planned Features
- Password reset functionality
- Email verification
- Two-factor authentication
- User roles and permissions
- Admin dashboard

### n8n Integration
- User-specific AI processing
- Personalized recommendations
- User analytics and insights

## Security Best Practices

1. **Change JWT Secret**: Use a strong, unique secret
2. **HTTPS Only**: Use SSL in production
3. **Rate Limiting**: Implement API rate limits
4. **Input Validation**: Validate all user inputs
5. **Regular Updates**: Keep dependencies updated

---

This authentication system provides a solid foundation for multi-user support while maintaining the existing n8n integration and AI features. Users can now securely access their personal trading data across web and Telegram platforms. 