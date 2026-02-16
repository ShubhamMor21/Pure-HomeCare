import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import SplashScreen from "@/components/ui/SplashScreen";

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showSplash, setShowSplash] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    try {
      await login(email, password);
      setShowSplash(true);
      setTimeout(() => {
        navigate("/dashboard");
      }, 5000);
    } catch (err) {
      setError("Invalid email or password");
    }
  };

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar p-12 flex-col justify-between relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-sidebar-primary rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-sidebar-primary rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <img src="/favicon.ico" alt="Logo" className="w-14 h-14 object-contain" />
            <div>
              <h1 className="text-xl font-bold text-sidebar-foreground">
                Pure Homecare
              </h1>
              <p className="text-sm text-sidebar-foreground/60">
                VR Training Platform
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-bold text-sidebar-foreground leading-tight">
            Transform Training
            <br />
            with Immersive VR
          </h2>
          <p className="text-sidebar-foreground/70 text-lg max-w-md">
            Manage and monitor VR training sessions for healthcare
            professionals. Real-time device control at your fingertips.
          </p>

          <div className="flex items-center gap-6 pt-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-sidebar-primary">50+</p>
              <p className="text-sm text-sidebar-foreground/60">Devices</p>
            </div>
            <div className="w-px h-12 bg-sidebar-border" />
            <div className="text-center">
              <p className="text-3xl font-bold text-sidebar-primary">1.2k</p>
              <p className="text-sm text-sidebar-foreground/60">Sessions</p>
            </div>
            <div className="w-px h-12 bg-sidebar-border" />
            <div className="text-center">
              <p className="text-3xl font-bold text-sidebar-primary">98%</p>
              <p className="text-sm text-sidebar-foreground/60">Success Rate</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-sidebar-foreground/50">
          © 2026 Pure Homecare. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <img src="/favicon.ico" alt="Logo" className="w-18 h-18 object-contain" />
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Pure Homecare
              </h1>
              <p className="text-sm text-muted-foreground">
                VR Training Platform
              </p>
            </div>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
              <CardDescription>
                Sign in to access your training dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm animate-fade-in">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="trainer@purehomecare.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11"
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>

                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pr-10"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 mt-6"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            Need help? Contact{" "}
            <a
              href="mailto:support@purehomecare.com"
              className="text-primary hover:underline"
            >
              IT Support
            </a>
          </p>
        </div>
      </div>
    </div >
  );
}
