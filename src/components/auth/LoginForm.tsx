import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const { login, signup, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = location.state?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required");
      return;
    }

    try {
      if (isSignUp) {
        if (!name.trim()) {
          setError("Name is required for sign up");
          return;
        }
        await signup(email, password, name);
        navigate("/", { replace: true });
      } else {
        await login(email, password);
        navigate(redirectPath, { replace: true });
      }
    } catch (err) {
      console.error("Authentication error:", err);
      setError(
        err instanceof Error
          ? err.message
          : isSignUp
            ? "Sign up failed. Please try again."
            : "Login failed. Please check your credentials.",
      );
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError("");
    if (!isSignUp) {
      // Switching to sign up, clear demo credentials
      setEmail("");
      setPassword("");
    } else {
      // Switching to login, set demo credentials
      setEmail("demo@creator.com");
      setPassword("demo123");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="bg-gray-900 border-gray-800 text-white">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <h1 className="text-4xl font-extrabold tracking-tight text-white">
                viral<span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">IQ</span><span className="text-orange-500">🔥</span>
              </h1>
            </div>
            <CardTitle className="text-xl text-white">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {isSignUp
                ? "Create your account to get started"
                : "Sign in to access your dashboard"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white focus:border-[#00F0FF] focus:ring-[#00F0FF]"
                    placeholder="Enter your full name"
                    required={isSignUp}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white focus:border-[#00F0FF] focus:ring-[#00F0FF]"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white focus:border-[#00F0FF] focus:ring-[#00F0FF] pr-10"
                    placeholder="Enter your password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert className="bg-red-900/30 border-red-800 text-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-[#00F0FF] text-black hover:bg-[#00F0FF]/80 font-medium"
                disabled={isLoading}
              >
                {isLoading
                  ? isSignUp
                    ? "Creating Account..."
                    : "Signing in..."
                  : isSignUp
                    ? "Create Account"
                    : "Sign In"}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-[#00F0FF] hover:text-[#00F0FF]/80 hover:bg-transparent"
                  onClick={toggleMode}
                  disabled={isLoading}
                >
                  {isSignUp
                    ? "Already have an account? Sign In"
                    : "Don't have an account? Sign Up"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default LoginForm;
