import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense } from "react";
import NotFound from "./pages/NotFound";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import TradeHistory from "./pages/TradeHistory";
import AddTrade from "./pages/AddTrade";
import Analysis from "./pages/Analysis";
import Settings from "./pages/Settings";
import Checklists from "./pages/Checklists";
import TradeDetails from "./pages/TradeDetails";
import ErrorBoundary from "./components/ErrorBoundary";
import Calendar from "./pages/Calendar";
import Login from "./pages/Login";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

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
      <Route path="/register" element={<Login />} />
      
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
      
      {/* Catch all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <TooltipProvider>
        <ErrorBoundary>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </ErrorBoundary>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
