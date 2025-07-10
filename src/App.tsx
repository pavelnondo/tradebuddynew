import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import TradeHistory from "./pages/TradeHistory";
import AddTrade from "./pages/AddTrade";
import Analysis from "./pages/Analysis";
import Settings from "./pages/Settings";
import Checklists from "./pages/Checklists";
import Strategy from "./pages/Strategy";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<ErrorBoundary><Layout><Dashboard /></Layout></ErrorBoundary>} />
      <Route path="/trades" element={<ErrorBoundary><Layout><TradeHistory /></Layout></ErrorBoundary>} />
      <Route path="/add-trade" element={<ErrorBoundary><Layout><AddTrade /></Layout></ErrorBoundary>} />
      <Route path="/analysis" element={<ErrorBoundary><Layout><Analysis /></Layout></ErrorBoundary>} />
      <Route path="/checklists" element={<ErrorBoundary><Layout><Checklists /></Layout></ErrorBoundary>} />
      <Route path="/strategy" element={<ErrorBoundary><Layout><Strategy /></Layout></ErrorBoundary>} />
      <Route path="/settings" element={<ErrorBoundary><Layout><Settings /></Layout></ErrorBoundary>} />
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
