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
import VRBackground from "@/components/ui/VRBackground";
import VRVisualSection from "@/components/ui/VRVisualSection";

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showSplash, setShowSplash] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Animated VR background */}
      <VRBackground />

      {/* Left Panel - VR Visual Section */}
      <VRVisualSection />

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 relative z-10">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8 animate-fade-in">
            <div className="relative">
              <img
                src="/favicon.ico"
                alt="Logo"
                className="w-16 h-16 object-contain"
              />
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-cyan-500/0 to-cyan-500/0" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Pure Homecare</h1>
              <p className="text-sm text-cyan-300/70 tracking-wide">
                VR Training Platform
              </p>
            </div>
          </div>

          {/* Glassmorphism login card */}
          <div className="relative animate-fade-in" style={{ animationDelay: "0.1s" }}>
            {/* Glow effect background */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition duration-500" />

            <Card
              className="relative border-0 shadow-2xl"
              style={{
                background: "rgba(15, 23, 42, 0.7)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(34, 211, 238, 0.1)",
                boxShadow: "0 8px 32px rgba(34, 211, 238, 0.1)",
              }}
            >
              <CardHeader className="space-y-3 pb-8">
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                  Welcome back
                </CardTitle>
                <CardDescription className="text-blue-200/70">
                  Sign in to access your VR training dashboard
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div
                      className="p-4 rounded-lg text-sm font-medium text-red-300 animate-shake border-l-4 border-red-500/50"
                      style={{
                        background: "rgba(239, 68, 68, 0.1)",
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      {error}
                    </div>
                  )}

                  {/* Email input */}
                  <div className="space-y-2.5 group">
                    <Label
                      htmlFor="email"
                      className="text-sm font-medium text-cyan-300 group-hover:text-cyan-200 transition-colors"
                    >
                      Email
                    </Label>
                    <div className="relative">
                      <div
                        className={`absolute inset-0 rounded-lg transition-all duration-300 ${
                          focusedField === "email"
                            ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/10 shadow-[0_0_20px_rgba(34,211,238,0.15)]"
                            : "bg-transparent"
                        }`}
                      />
                      <Input
                        id="email"
                        type="email"
                        placeholder="trainer@purehomecare.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedField("email")}
                        onBlur={() => setFocusedField(null)}
                        className="relative h-11 bg-blue-950/40 border-cyan-500/30 text-white placeholder:text-blue-300/50 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all duration-200"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Password input */}
                  <div className="space-y-2.5 group">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="password"
                        className="text-sm font-medium text-cyan-300 group-hover:text-cyan-200 transition-colors"
                      >
                        Password
                      </Label>
                    </div>

                    <div className="relative">
                      <div
                        className={`absolute inset-0 rounded-lg transition-all duration-300 ${
                          focusedField === "password"
                            ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/10 shadow-[0_0_20px_rgba(34,211,238,0.15)]"
                            : "bg-transparent"
                        }`}
                      />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocusedField("password")}
                        onBlur={() => setFocusedField(null)}
                        className="relative h-11 bg-blue-950/40 border-cyan-500/30 text-white placeholder:text-blue-300/50 pr-10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all duration-200"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400/60 hover:text-cyan-300 transition-colors duration-200"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Sign in button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-8 h-11 relative group/btn overflow-hidden rounded-lg font-semibold text-white transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                    style={{
                      background:
                        "linear-gradient(135deg, hsl(187, 85%, 43%), hsl(195, 85%, 50%))",
                      boxShadow: isLoading
                        ? "0 0 20px rgba(34, 211, 238, 0.4)"
                        : "0 0 10px rgba(34, 211, 238, 0.2)",
                    }}
                  >
                    {/* Animated background shine effect */}
                    <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300">
                      <div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]"
                        style={{
                          animation: "shimmer 2s infinite",
                        }}
                      />
                    </div>

                    <div className="relative flex items-center justify-center gap-2">
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Signing in...</span>
                        </>
                      ) : (
                        "Sign in"
                      )}
                    </div>
                  </button>
                </form>

                {/* Support link */}
                <p className="text-center text-sm text-blue-300/60 mt-6">
                  Need help?{" "}
                  <a
                    href="mailto:support@purehomecare.com"
                    className="text-cyan-300 hover:text-cyan-200 font-medium transition-colors duration-200 hover:underline"
                  >
                    Contact IT Support
                  </a>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Security note */}
          <div
            className="text-center text-xs text-blue-300/40 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            Your credentials are secure and encrypted
          </div>
        </div>
      </div>

      {/* Additional CSS animations */}
      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes glow-input {
          0%, 100% {
            box-shadow: 0 0 10px rgba(34, 211, 238, 0.2);
          }
          50% {
            box-shadow: 0 0 20px rgba(34, 211, 238, 0.4);
          }
        }

        .group:hover .group-hover\:opacity-100 {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
