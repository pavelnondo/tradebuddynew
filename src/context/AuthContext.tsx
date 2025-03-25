
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetLoginRedirectHandled: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginRedirectHandled, setLoginRedirectHandled] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle the URL hash for authentication results
  useEffect(() => {
    const handleAuthRedirect = async () => {
      if (loginRedirectHandled) return;
      
      // Check for error parameters in the URL
      if (location.hash && location.hash.includes('error=')) {
        const params = new URLSearchParams(location.hash.substring(1));
        const error = params.get('error');
        const errorDescription = params.get('error_description');
        
        if (error && errorDescription) {
          console.error('Auth redirect error:', error, errorDescription);
          toast({
            title: "Authentication error",
            description: errorDescription.replace(/\+/g, ' '),
            variant: "destructive",
          });
          
          // Clear the hash from the URL
          window.history.replaceState(null, document.title, window.location.pathname);
          setLoginRedirectHandled(true);
          navigate('/login');
          return;
        }
      }
      
      setLoginRedirectHandled(true);
    };

    handleAuthRedirect();
  }, [location, loginRedirectHandled, toast, navigate]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Redirect to dashboard on successful login
        if (event === 'SIGNED_IN' && session) {
          navigate('/');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const resetLoginRedirectHandled = () => {
    setLoginRedirectHandled(false);
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name?: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            name
          },
          emailRedirectTo: window.location.origin
        }
      });
      
      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Signup failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        title: "Logout failed",
        description: "An error occurred during logout",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      isLoading, 
      login, 
      signup, 
      logout,
      resetLoginRedirectHandled
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
