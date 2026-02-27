# TradeBuddy - Professional Trading Journal

A comprehensive, production-ready trading journal application with advanced analytics, goal tracking, and psychological insights for serious traders.

## 🚀 Features

- **Trade Management**: Add, edit, and track trades with detailed analytics
- **Multi-Journal Support**: Organize trades across multiple trading accounts/journals
- **Advanced Analytics**: Equity curves, win rates, P&L analysis, emotion tracking
- **Psychology Insights**: Track trading emotions and their impact on performance
- **Goal Tracking**: Set and monitor trading goals with progress tracking
- **Checklists**: Pre-trade and post-trade checklists for consistency
- **Calendar View**: Visual heatmap of trading activity and P&L
- **Export Options**: Export trades as CSV, JSON, or PDF
- **Offline Support**: Works offline with automatic sync when connection is restored
- **Responsive Design**: Fully responsive, works on mobile, tablet, and desktop
- **Accessibility**: WCAG AA compliant with keyboard navigation and screen reader support

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: shadcn/ui, Tailwind CSS, Framer Motion
- **State Management**: Zustand, React Query
- **Charts**: Recharts, Chart.js
- **Forms**: React Hook Form, Zod validation
- **Backend**: Node.js, Express, PostgreSQL (Supabase)
- **Authentication**: JWT-based authentication

## 📦 Installation

### Prerequisites

- Node.js 18+ and npm (or use [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))

### Setup

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd tradebuddynew

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

## 🏗️ Project Structure

```
src/
├── components/      # Reusable UI components
│   ├── ui/         # shadcn/ui components
│   ├── shared/     # Shared components (TradeCard, StatCard, etc.)
│   └── charts/     # Chart components
├── pages/          # Page components
├── hooks/          # Custom React hooks
├── stores/         # Zustand state management
├── services/       # API services
├── utils/          # Utility functions
├── types/          # TypeScript type definitions
└── contexts/       # React contexts (Theme, etc.)
```

## 🎨 Code Quality

This project follows professional production standards:

- ✅ **TypeScript**: Fully typed with no `any` types
- ✅ **Error Handling**: Comprehensive try-catch blocks and error boundaries
- ✅ **Performance**: Optimized with useMemo, useCallback, and proper memoization
- ✅ **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- ✅ **Code Cleanliness**: No console.logs, unused imports removed
- ✅ **Consistent Formatting**: Standardized code style throughout

## 📱 Deployment

For production deployment with Nginx on port 8091 and backend on 4004, see `DEPLOYMENT.md` for Docker-based instructions.

## 🔒 Security

- JWT-based authentication
- Input validation with Zod
- XSS protection
- Secure API endpoints

## 📝 License

This project is private and proprietary.

## 🤝 Contributing

This is a private project. For questions or issues, please contact the project maintainer.

## 📧 Support

For support, please contact the development team.

---

Built with ❤️ for serious traders
