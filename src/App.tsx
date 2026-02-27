import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OfflineSupport } from "@/components/OfflineSupport";
import { TouchGestures } from "@/components/TouchGestures";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense } from "react";
import NotFound from "./pages/NotFound";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import TradeHistory from "./pages/TradeHistory";
import AddTrade from "./pages/AddTrade";
import AddNoTradeDay from "./pages/AddNoTradeDay";
import TradeManagement from "./pages/TradeManagement";
import Analysis from "./pages/Analysis";
import Settings from "./pages/Settings";
import Checklists from "./pages/Checklists";
import TradeDetails from "./pages/TradeDetails";
import ErrorBoundary from "./components/ErrorBoundary";
import Calendar from "./pages/Calendar";
import Psychology from "./pages/Psychology";
import PlanningGoals from "./pages/PlanningGoals";
import RiskCalculator from "./pages/RiskCalculator";
import Education from "./pages/Education";
import Login from "./pages/Login";
import Register from "./pages/Register";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Enhanced Loading component with animation
const PageLoader = () => {
  const { themeConfig } = useTheme();
  return (
    <div 
      className="flex items-center justify-center min-h-screen"
      style={{ backgroundColor: themeConfig.bg }}
    >
      <div className="flex flex-col items-center space-y-6">
        {/* Main Spinner */}
        <div className="relative">
          <div 
            className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: `${themeConfig.accent}40`, borderTopColor: 'transparent' }}
          />
          <div 
            className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-accent rounded-full animate-spin"
            style={{ 
              borderColor: 'transparent',
              borderBottomColor: themeConfig.accent,
              animationDirection: 'reverse',
              animationDuration: '0.8s'
            }}
          />
          {/* Center Dot */}
          <div 
            className="absolute inset-0 m-auto w-3 h-3 rounded-full animate-pulse"
            style={{ backgroundColor: themeConfig.accent }}
          />
        </div>
        
        {/* Loading Text */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-lg font-semibold animate-pulse" style={{ color: themeConfig.foreground }}>
            Loading
          </p>
          <p className="text-sm" style={{ color: themeConfig.mutedForeground }}>
            Preparing your workspace...
          </p>
        </div>
        
        {/* Progress Dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full animate-bounce"
              style={{ 
                backgroundColor: themeConfig.accent,
                animationDelay: `${i * 0.15}s`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Protected Route Component with modern design
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <ErrorBoundary>
            <Layout>
              <Suspense fallback={<PageLoader />}>
                <Dashboard />
              </Suspense>
            </Layout>
          </ErrorBoundary>
        </ProtectedRoute>
      } />
      
      <Route path="/trades" element={
        <ProtectedRoute>
          <ErrorBoundary>
            <Layout>
              <Suspense fallback={<PageLoader />}>
                <TradeManagement />
              </Suspense>
            </Layout>
          </ErrorBoundary>
        </ProtectedRoute>
      } />
      
      <Route path="/trade-history" element={
        <ProtectedRoute>
          <ErrorBoundary>
            <Layout>
              <Suspense fallback={<PageLoader />}>
                <TradeHistory />
              </Suspense>
            </Layout>
          </ErrorBoundary>
        </ProtectedRoute>
      } />
      
      <Route path="/trade/:id" element={
        <ProtectedRoute>
          <ErrorBoundary>
            <Layout>
              <Suspense fallback={<PageLoader />}>
                <TradeDetails />
              </Suspense>
            </Layout>
          </ErrorBoundary>
        </ProtectedRoute>
      } />
      
      <Route path="/edit-trade/:id" element={
        <ProtectedRoute>
          <ErrorBoundary>
            <Layout>
              <Suspense fallback={<PageLoader />}>
                <AddTrade />
              </Suspense>
            </Layout>
          </ErrorBoundary>
        </ProtectedRoute>
      } />
      
      <Route path="/add-trade" element={
        <ProtectedRoute>
          <ErrorBoundary>
            <Layout>
              <Suspense fallback={<PageLoader />}>
                <AddTrade />
              </Suspense>
            </Layout>
          </ErrorBoundary>
        </ProtectedRoute>
      } />
      
      <Route path="/add-no-trade-day" element={
        <ProtectedRoute>
          <ErrorBoundary>
            <Layout>
              <Suspense fallback={<PageLoader />}>
                <AddNoTradeDay />
              </Suspense>
            </Layout>
          </ErrorBoundary>
        </ProtectedRoute>
      } />
      
      <Route path="/analysis" element={
        <ProtectedRoute>
          <ErrorBoundary>
            <Layout>
              <Suspense fallback={<PageLoader />}>
                <Analysis />
              </Suspense>
            </Layout>
          </ErrorBoundary>
        </ProtectedRoute>
      } />
      
      <Route path="/checklists" element={
        <ProtectedRoute>
          <ErrorBoundary>
            <Layout>
              <Suspense fallback={<PageLoader />}>
                <Checklists />
              </Suspense>
            </Layout>
          </ErrorBoundary>
        </ProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute>
          <ErrorBoundary>
            <Layout>
              <Suspense fallback={<PageLoader />}>
                <Settings />
              </Suspense>
            </Layout>
          </ErrorBoundary>
        </ProtectedRoute>
      } />
      
      <Route path="/calendar" element={
        <ProtectedRoute>
          <ErrorBoundary>
            <Layout>
              <Suspense fallback={<PageLoader />}>
                <Calendar />
              </Suspense>
            </Layout>
          </ErrorBoundary>
        </ProtectedRoute>
      } />
      
      <Route path="/psychology" element={
        <ProtectedRoute>
          <ErrorBoundary>
            <Layout>
              <Suspense fallback={<PageLoader />}>
                <Psychology />
              </Suspense>
            </Layout>
          </ErrorBoundary>
        </ProtectedRoute>
      } />
      
      <Route path="/planning-goals" element={
        <ProtectedRoute>
          <ErrorBoundary>
            <Layout>
              <Suspense fallback={<PageLoader />}>
                <PlanningGoals />
              </Suspense>
            </Layout>
          </ErrorBoundary>
        </ProtectedRoute>
      } />
      
      <Route path="/risk-calculator" element={
        <ProtectedRoute>
          <ErrorBoundary>
            <Layout>
              <Suspense fallback={<PageLoader />}>
                <RiskCalculator />
              </Suspense>
            </Layout>
          </ErrorBoundary>
        </ProtectedRoute>
      } />
      
      <Route path="/education" element={
        <ProtectedRoute>
          <ErrorBoundary>
            <Layout>
              <Suspense fallback={<PageLoader />}>
                <Education />
              </Suspense>
            </Layout>
          </ErrorBoundary>
        </ProtectedRoute>
      } />
      
      {/* Redirect /goals to /planning-goals */}
      <Route path="/goals" element={<Navigate to="/planning-goals" replace />} />
      
      {/* Catch all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <ThemeProvider>
        <TooltipProvider>
          <OfflineSupport>
            <TouchGestures>
              <ErrorBoundary>
                <Toaster />
                <Sonner />
                <AppRoutes />
              </ErrorBoundary>
            </TouchGestures>
          </OfflineSupport>
        </TooltipProvider>
      </ThemeProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
