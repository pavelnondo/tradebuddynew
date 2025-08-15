# 🍎 TradeBuddy - Apple-Inspired Trading Journal

> **Professional trading journal designed with Apple-level efficiency and aesthetics**

## 🌟 Overview

TradeBuddy is a modern, Apple-inspired trading journal that combines elegant design with powerful functionality. Built for serious traders who demand both beauty and performance, it provides comprehensive trade tracking, advanced analytics, and psychological insights.

## ✨ Key Features

### 🎨 **Apple-Inspired Design**
- **Glass morphism** effects and backdrop blur
- **Smooth animations** and micro-interactions
- **Timeless aesthetics** that won't age quickly
- **Responsive design** for all devices
- **Dark/Light mode** support

### 📊 **Advanced Analytics**
- **Real-time performance metrics**
- **Win/loss analysis** with visual charts
- **Emotion tracking** and psychology insights
- **Asset performance** breakdown
- **Risk/reward analysis**

### 🔐 **Enterprise Security**
- **JWT authentication** with refresh tokens
- **Rate limiting** and DDoS protection
- **SQL injection prevention**
- **XSS protection** and security headers
- **Encrypted data storage**

### ⚡ **High Performance**
- **Optimized database** with proper indexing
- **Caching strategies** for fast queries
- **Compression** and CDN-ready assets
- **Lazy loading** and code splitting
- **Progressive Web App** capabilities

## 🏗️ Architecture

### Frontend (React + TypeScript)
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── charts/         # Chart.js visualizations
│   └── forms/          # Form components
├── pages/              # Application pages
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript definitions
└── styles/             # Global styles and design system
```

### Backend (Node.js + Express)
```
backend/
├── app.js              # Main application server
├── database-schema-apple.sql  # PostgreSQL schema
├── package.json        # Dependencies
└── uploads/            # File upload directory
```

### Database (PostgreSQL)
- **UUID primary keys** for security
- **Optimized indexes** for performance
- **Triggers** for automatic calculations
- **Full-text search** capabilities
- **JSONB** for flexible data storage

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/tradebuddy/tradebuddy.git
   cd tradebuddy
   ```

2. **Install dependencies**
   ```bash
   # Frontend
   npm install
   
   # Backend
   cd backend
   npm install
   cd ..
   ```

3. **Setup database**
   ```bash
   # Create database
   createdb tradebuddy
   
   # Run migrations
   psql tradebuddy < backend/database-schema-apple.sql
   ```

4. **Configure environment**
   ```bash
   # Backend
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   cd ..
   
   # Frontend
   cp .env.example .env.local
   # Edit .env.local with your API URL
   ```

5. **Start development servers**
   ```bash
   # Terminal 1: Backend
   cd backend
   npm run dev
   
   # Terminal 2: Frontend
   npm run dev
   ```

6. **Open your browser**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

### Production Deployment

Use our automated deployment script:

```bash
# Make script executable
chmod +x deploy-apple.sh

# Deploy to VPS
./deploy-apple.sh
```

The script will:
- ✅ Build the frontend
- ✅ Deploy to your VPS
- ✅ Setup PostgreSQL database
- ✅ Configure nginx with SSL
- ✅ Start services with PM2
- ✅ Perform health checks

## 🛠️ Technology Stack

### Frontend
- **React 18** with Suspense and concurrent features
- **TypeScript** for type safety
- **Vite** for fast development and building
- **Tailwind CSS** for utility-first styling
- **shadcn/ui** for beautiful components
- **Chart.js** for data visualization
- **React Query** for data fetching
- **React Router** for navigation

### Backend
- **Node.js** with Express
- **PostgreSQL** with advanced features
- **JWT** for authentication
- **bcrypt** for password hashing
- **Multer** for file uploads
- **Helmet** for security headers
- **Rate limiting** for API protection
- **Compression** for performance

### Infrastructure
- **Nginx** for reverse proxy and SSL
- **PM2** for process management
- **PostgreSQL** for data persistence
- **Let's Encrypt** for SSL certificates

## 📊 Database Schema

### Core Tables
- **users** - User accounts and profiles
- **trading_accounts** - Multiple trading accounts
- **trades** - Individual trade records
- **checklists** - Trading discipline checklists
- **performance_metrics** - Pre-calculated analytics
- **notifications** - User notifications

### Key Features
- **UUID primary keys** for security
- **Automatic P&L calculation** via triggers
- **Full-text search** on trade notes
- **JSONB** for flexible metadata
- **Proper indexing** for performance

## 🎨 Design System

### Colors
```css
/* Apple-inspired color palette */
--primary: 240 5.9% 10%;      /* Deep blue */
--success: 142 76% 36%;       /* Apple green */
--warning: 38 92% 50%;        /* Apple orange */
--danger: 0 84% 60%;          /* Apple red */
--muted: 240 4.8% 95.9%;      /* Light gray */
```

### Typography
```css
/* Apple system fonts */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Spacing
```css
/* 8px grid system */
--spacing-xs: 0.25rem;  /* 4px */
--spacing-sm: 0.5rem;   /* 8px */
--spacing-md: 1rem;     /* 16px */
--spacing-lg: 1.5rem;   /* 24px */
--spacing-xl: 2rem;     /* 32px */
```

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```bash
NODE_ENV=production
PORT=3001
JWT_SECRET=your-super-secret-jwt-key
DATABASE_URL=postgresql://user:password@localhost/tradebuddy
CORS_ORIGIN=https://yourdomain.com
```

**Frontend (.env.local)**
```bash
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=TradeBuddy
```

### Feature Flags
```typescript
features: {
  darkMode: true,
  realTimeUpdates: true,
  advancedAnalytics: true,
  multiAccountSupport: true,
  exportData: true,
  notifications: true,
  voiceInput: false,    // Future feature
  aiInsights: false,    // Future feature
}
```

## 📈 Performance

### Frontend Optimizations
- **Code splitting** with React.lazy()
- **Tree shaking** for smaller bundles
- **Image optimization** and lazy loading
- **Service worker** for caching
- **Preload critical resources**

### Backend Optimizations
- **Connection pooling** for database
- **Query optimization** with proper indexes
- **Response compression** with gzip
- **Rate limiting** to prevent abuse
- **Caching** for frequently accessed data

### Database Optimizations
- **Composite indexes** for complex queries
- **Partial indexes** for filtered data
- **Materialized views** for analytics
- **Partitioning** for large datasets
- **Query optimization** with EXPLAIN

## 🔒 Security

### Authentication
- **JWT tokens** with refresh mechanism
- **Password hashing** with bcrypt
- **Session management** with secure cookies
- **Rate limiting** on auth endpoints

### Data Protection
- **SQL injection prevention** with parameterized queries
- **XSS protection** with content security policy
- **CSRF protection** with tokens
- **Input validation** and sanitization

### Infrastructure Security
- **HTTPS only** with HSTS headers
- **Security headers** with Helmet
- **File upload validation** and virus scanning
- **Database connection encryption**

## 🧪 Testing

### Frontend Testing
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

### Backend Testing
```bash
# Unit tests
cd backend && npm test

# API tests
npm run test:api

# Database tests
npm run test:db
```

## 📚 API Documentation

### Authentication
```http
POST /api/auth/register
POST /api/auth/login
GET /api/user/profile
```

### Trades
```http
GET /api/trades
POST /api/trades
PUT /api/trades/:id
DELETE /api/trades/:id
```

### Analytics
```http
GET /api/analytics/overview
GET /api/analytics/performance
GET /api/analytics/emotions
```

### Accounts
```http
GET /api/accounts
POST /api/accounts
PUT /api/accounts/:id
DELETE /api/accounts/:id
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a pull request

### Development Guidelines
- Follow **TypeScript** best practices
- Use **Prettier** for code formatting
- Write **comprehensive tests**
- Follow **Apple design principles**
- Document **all new features**

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.tradebuddy.app](https://docs.tradebuddy.app)
- **Issues**: [GitHub Issues](https://github.com/tradebuddy/tradebuddy/issues)
- **Discussions**: [GitHub Discussions](https://github.com/tradebuddy/tradebuddy/discussions)
- **Email**: support@tradebuddy.app

## 🚀 Roadmap

### v2.1 - Advanced Analytics
- [ ] Machine learning insights
- [ ] Predictive analytics
- [ ] Risk assessment tools
- [ ] Portfolio optimization

### v2.2 - Mobile App
- [ ] React Native mobile app
- [ ] Push notifications
- [ ] Offline support
- [ ] Biometric authentication

### v2.3 - AI Features
- [ ] Voice input for trades
- [ ] AI-powered insights
- [ ] Automated trade analysis
- [ ] Smart notifications

---

**Built with ❤️ and Apple-inspired design principles**
