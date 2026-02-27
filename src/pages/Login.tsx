import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, BarChart3, Brain, Target, AlertCircle } from "lucide-react";
import { GlowCard } from "@/components/ui/spotlight-card";
import { Button } from "@/components/ui/button";
import { ParticleButton } from "@/components/ui/particle-button";
import { ShapeLandingHero } from "@/components/ui/shape-landing-hero";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { API_BASE_URL } from "@/config";
import { loginSchema, type LoginFormData } from "@/schemas/authSchema";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      const responseData = await response.json();

      if (response.ok) {
        localStorage.setItem("token", responseData.token);
        localStorage.setItem("user", JSON.stringify(responseData.user));
        navigate("/dashboard");
      } else {
        setError(responseData.message || responseData.error || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ShapeLandingHero
      badge="Trading Journal"
      headline="Track. Analyze. Improve."
      subheadline="Professional trading journal with AI-powered insights"
    >
    <div className="w-full max-w-md mx-auto">
        {/* Login Card */}
        <div className="modern-card">
          <div className="modern-section-header">
            <h2 className="text-2xl font-bold text-foreground text-center">Welcome Back</h2>
            <p className="text-sm text-muted-foreground text-center mt-1">
              Sign in to your account to continue
            </p>
          </div>
          
          <div className="modern-divider"></div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="border-2">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                {...register('email')}
                className="modern-input h-12"
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-foreground">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  {...register('password')}
                  className="modern-input h-12 pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-4 hover:bg-muted rounded-r-lg"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Eye className="h-5 w-5 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.password.message}
                </p>
              )}
            </div>

            <ParticleButton 
              type="submit" 
              className="w-full modern-btn-primary h-12 text-base font-semibold"
              disabled={isLoading}
              showClickIcon
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </ParticleButton>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button
                type="button"
                className="font-semibold text-primary hover:underline transition-all"
                onClick={() => navigate('/register')}
              >
                Sign up
              </button>
            </p>
          </div>
        </div>

        {/* Features Preview - GlowCards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlowCard glowColor="blue" size="sm" customSize className="w-full h-auto min-h-[140px]">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">Essential Analytics</h3>
              <p className="text-xs text-muted-foreground">Clear insights into your trading performance</p>
            </div>
          </GlowCard>
          <GlowCard glowColor="purple" size="sm" customSize className="w-full h-auto min-h-[140px]">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Target className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">Performance Tracking</h3>
              <p className="text-xs text-muted-foreground">Monitor your progress over time</p>
            </div>
          </GlowCard>
          <GlowCard glowColor="green" size="sm" customSize className="w-full h-auto min-h-[140px]">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Brain className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">AI Insights</h3>
              <p className="text-xs text-muted-foreground">Smart recommendations for improvement</p>
            </div>
          </GlowCard>
        </div>
      </div>
    </ShapeLandingHero>
  );
}
