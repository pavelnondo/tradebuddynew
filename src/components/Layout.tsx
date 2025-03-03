
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const location = useLocation();

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

  const navItems = [
    { path: "/", label: "Dashboard" },
    { path: "/trades", label: "Trade History" },
    { path: "/add-trade", label: "Add Trade" },
    { path: "/analysis", label: "Analysis" },
    { path: "/screenshots", label: "Screenshots" },
    { path: "/settings", label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold">
            Trade Journal Pro
          </Link>
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </Button>
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
        {children}
      </main>

      <footer className="border-t py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Trade Journal Pro. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
