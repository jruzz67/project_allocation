import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";
import { Navbar } from "./layout/Navbar";

export function ProtectedRoute({ allowedRoles }: { allowedRoles?: ("org" | "employee")[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If role is restricted
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If they are an employee but they need org access, go to dashboard.
    return <Navigate to="/" replace />;
  }

  // If employee hasn't completed setup, force them to setup
  if (user.role === "employee" && !user.is_setup_complete && window.location.pathname !== "/setup") {
    return <Navigate to="/setup" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <Navbar />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
    </div>
  );
}
