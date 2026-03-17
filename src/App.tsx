import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Clients from "./pages/Clients.tsx";
import Overview from "./pages/Overview.tsx";
import Comments from "./pages/Comments.tsx";
import Watch from "./pages/Watch.tsx";
import Landing from "./pages/Landing.tsx";
import Pricing from "./pages/Pricing.tsx";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/" />;
  return <>{children}</>;
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/overview"
              element={
                <ProtectedRoute>
                  <Overview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients"
              element={
                <ProtectedRoute>
                  <Clients />
                </ProtectedRoute>
              }
            />
            <Route
              path="/comments"
              element={
                <ProtectedRoute>
                  <Comments />
                </ProtectedRoute>
              }
            />
            <Route path="/watch/:videoId" element={<Watch />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}
