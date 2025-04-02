import { useState, useEffect } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Turnstile } from "@/components/Turnstile";

export default function Login() {
  const { user, login, resetLoginRedirectHandled } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Reset the login redirect handled flag when the component mounts
    resetLoginRedirectHandled();
  }, [resetLoginRedirectHandled]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!turnstileToken) {
      toast({
        title: "Verification required",
        description: "Please complete the security verification",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Pass turnstileToken as part of options object or modify login function
      await login(email, password);
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Check if there's an error in the URL (e.g., from a failed email verification)
  const hasAuthError = location.hash && location.hash.includes('error=');

  if (user) {
    return <Navigate to="/" />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-2">
            <div className="bg-primary p-2 rounded-full">
              <TrendingUp className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl font-bold">Trade Buddy</CardTitle>
            <CardDescription>
              Login to access your trading journal
            </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {hasAuthError && (
              <Alert variant="destructive">
                <AlertDescription>
                  There was an issue with your authentication link. Please try logging in again.
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {/* Cloudflare Turnstile */}
            <Turnstile 
              siteKey="1x00000000000000000000AA" 
              onVerify={setTurnstileToken} 
            />
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
            <div className="text-center text-sm">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
