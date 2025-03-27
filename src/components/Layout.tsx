
import { Moon, Sun, LogOut, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import ErrorBoundary from "./ErrorBoundary";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  // Toggle dark/light theme
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark");
  };

  // Set initial theme based on user preference
  useEffect(() => {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (isDark) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Handle user auth state changes
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "There was an issue logging you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const navItems = [
    { path: "/", label: "Dashboard" },
    { path: "/trades", label: "Trade History" },
    { path: "/add-trade", label: "Add Trade" },
    { path: "/strategy", label: "Strategy" },
    { path: "/analysis", label: "Analysis" },
    { path: "/screenshots", label: "Screenshots" },
    { path: "/checklists", label: "Checklists" },
    { path: "/settings", label: "Settings" },
  ];

  // Get user display name from user metadata or fall back to email
  const getUserDisplayName = () => {
    if (!user) return "";
    
    // Try to get name from user_metadata
    const name = user.user_metadata?.name;
    
    // If name exists in metadata, return it, otherwise return email (or part of it)
    return name || user.email?.split('@')[0] || user.email;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold">
            Trade Buddy
          </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Button variant="ghost" size="sm" className="gap-2">
                  <User size={16} />
                  {getUserDisplayName()}
                </Button>
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                  <LogOut size={20} />
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => navigate("/login")}>
                Login
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </Button>
          </div>
        </div>
      </header>

      <nav className="border-b">
        <div className="container mx-auto px-4 overflow-x-auto">
          <div className="flex space-x-1 py-2">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={location.pathname === item.path ? "default" : "ghost"}
                  className="whitespace-nowrap"
                >
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <main className="flex-1 container mx-auto px-4 py-6">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>

      <footer className="border-t py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Trade Buddy. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
