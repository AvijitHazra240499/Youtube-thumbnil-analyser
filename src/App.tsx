import { Suspense } from "react";
import { useRoutes, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Home from "./components/home";
import Pricing from "./components/dashboard/Pricing";
import LoginForm from "./components/auth/LoginForm";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { TrialProvider, useTrial } from "./contexts/TrialContext";
import routes from "./tempo-routes";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import ThumbnailAnalyzer from "./components/dashboard/ThumbnailAnalyzer";
import ScriptGenerator from "./components/dashboard/ScriptGenerator";
import KeywordMatrix from "./components/dashboard/KeywordMatrix";
import TweetGenerator from "./components/dashboard/TweetGenerator";
import ImageGenerator from "./components/dashboard/ImageGenerator";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Save the current location so we can redirect back after login
    const from = location.state?.from?.pathname || "/";
    return <Navigate to={`/login?redirect=${encodeURIComponent(from)}`} replace />;
  }

  return <>{children}</>;
}

function TrialGuard({ children }: { children: React.ReactNode }) {
  const { isPro, expired, loading } = useTrial();
  const location = useLocation();
  if (loading) return null;
  if (expired && !isPro && location.pathname !== "/pricing") {
    return <Navigate to="/pricing" replace />;
  }
  return <>{children}</>;
} 

function AppContent() {
  return (
    <TrialProvider>
      <Suspense
        fallback={
          <div className="min-h-screen bg-black flex items-center justify-center">
            <p className="text-white">Loading...</p>
          </div>
        }
      >
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <TrialGuard>
                  <DashboardLayout />
                </TrialGuard>
              </ProtectedRoute>
            }
          >
            <Route index element={<Home />} />
            <Route path="thumbnail-analyzer" element={<ThumbnailAnalyzer />} />
            <Route path="script-generator" element={<ScriptGenerator />} />
            <Route path="keyword-matrix" element={<KeywordMatrix />} />
            <Route path="image-generator" element={<ImageGenerator />} />
            <Route path="tweet-generator" element={<TweetGenerator />} />
            {import.meta.env.VITE_TEMPO === "true" && routes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={route.element}
              />
            ))}
          </Route>
          <Route path="/pricing" element={<Pricing />} />
        </Routes>
      </Suspense>
    </TrialProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
