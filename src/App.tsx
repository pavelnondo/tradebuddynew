
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NotFound from "./pages/NotFound";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import TradeHistory from "./pages/TradeHistory";
import AddTrade from "./pages/AddTrade";
import Analysis from "./pages/Analysis";
import Screenshots from "./pages/Screenshots";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Checklists from "./pages/Checklists";
import Strategy from "./pages/Strategy";
import ErrorBoundary from "./components/ErrorBoundary";
import Donate from "./pages/Donate";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/donate" element={<Donate />} />
      <Route path="/" element={
        <ProtectedRoute>
          <ErrorBoundary>
            <Layout><Dashboard /></Layout>
          </ErrorBoundary>
        </ProtectedRoute>
      } />
      <Route path="/trades" element={
        <ProtectedRoute>
          <ErrorBoundary>
            <Layout><TradeHistory /></Layout>
          </ErrorBoundary>
        </ProtectedRoute>
      } />
      <Route path="/add-trade" element={
        <ProtectedRoute>
          <ErrorBoundary>
            <Layout><AddTrade /></Layout>
          </ErrorBoundary>
        </ProtectedRoute>
      } />
      <Route path="/analysis" element={
        <ProtectedRoute>
          <ErrorBoundary>
            <Layout><Analysis /></Layout>
          </ErrorBoundary>
        </ProtectedRoute>
      } />
      <Route path="/screenshots" element={
        <ProtectedRoute>
          <ErrorBoundary>
            <Layout><Screenshots /></Layout>
          </ErrorBoundary>
        </ProtectedRoute>
      } />
      <Route path="/checklists" element={
        <ProtectedRoute>
          <ErrorBoundary>
            <Layout><Checklists /></Layout>
          </ErrorBoundary>
        </ProtectedRoute>
      } />
      <Route path="/strategy" element={
        <ProtectedRoute>
          <ErrorBoundary>
            <Layout><Strategy /></Layout>
          </ErrorBoundary>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <ErrorBoundary>
            <Layout><Settings /></Layout>
          </ErrorBoundary>
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <ErrorBoundary>
            <Toaster />
            <Sonner />
            <AppRoutes />
          </ErrorBoundary>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
