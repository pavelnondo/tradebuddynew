import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import ErrorBoundary from "./ErrorBoundary";

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
    localStorage.setItem("theme", newTheme);
  };

  // Set initial theme based on user preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme as "light" | "dark");
      if (savedTheme === "dark") document.documentElement.classList.add("dark");
    } else {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (isDark) {
        setTheme("dark");
        document.documentElement.classList.add("dark");
      }
    }
  }, []);

  const navItems = [
    { path: "/", label: "Dashboard" },
    { path: "/trades", label: "Trade History" },
    { path: "/analysis", label: "Analysis" },
    { path: "/calendar", label: "Calendar" },
    { path: "/checklists", label: "Checklists" },
    { path: "/strategy", label: "Strategy" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2M16 11V7a4 4 0 10-8 0v4M5 11h14v10H5V11z" /></svg>
            </div>
            <h1 className="text-xl font-bold">Trade Buddy</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <div className="relative">
              <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                <span className="sr-only">Notifications</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
              </button>
            </div>
            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
              U
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 overflow-x-auto">
          <div className="flex space-x-8">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <button
                  className={`tab-button px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-150 ${location.pathname === item.path ? "border-blue-500 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
                >
                  {item.label}
                </button>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 shadow-sm mt-8">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2M16 11V7a4 4 0 10-8 0v4M5 11h14v10H5V11z" /></svg>
              </div>
              <span className="font-bold">Trade Buddy</span>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">About</a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Features</a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Help</a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Contact</a>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Trade Buddy. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
