import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Context
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

// Pages
import Landing from "./pages/Landing";
import AuthPage from "./pages/Auth";
import EmployeeSetup from "./pages/EmployeeSetup";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import Employees from "./pages/Employees";
import Projects from "./pages/Projects";
import AllocatePage from "./pages/AllocatePage";
import ProjectTeam from "./pages/ProjectTeam";

// Components
import { ProtectedRoute } from "./components/ProtectedRoute";

function RootRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Landing />;
  
  if (user.role === "employee") {
    if (!user.is_setup_complete) return <Navigate to="/setup" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/projects" replace />;
}

const router = createBrowserRouter([
  { path: "/", element: <RootRedirect /> },
  { path: "/auth", element: <AuthPage /> },
  
  // Protected Routes
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/setup", element: <EmployeeSetup /> },
    ]
  },

  // Employee Only
  {
    element: <ProtectedRoute allowedRoles={["employee"]} />,
    children: [
      { path: "/dashboard", element: <EmployeeDashboard /> },
    ]
  },
  
  // Organization Only
  {
    element: <ProtectedRoute allowedRoles={["org"]} />,
    children: [
      { path: "/employees", element: <Employees /> },
      { path: "/projects", element: <Projects /> },
      { path: "/projects/:project_id/allocate", element: <AllocatePage /> },
      { path: "/projects/:project_id/team", element: <ProjectTeam /> },
    ]
  },

  // 404
  {
    path: "*",
    element: (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>
          <h1 className="text-8xl font-bold text-red-500 mb-6 drop-shadow-2xl">404</h1>
          <p className="text-3xl mb-8 text-foreground">Page Not Found</p>
          <a
            href="/"
            className="inline-flex items-center gap-3 bg-primary hover:bg-primary/90 px-10 py-5 rounded-2xl text-lg font-medium text-primary-foreground transition-all"
          >
            Back to Home
          </a>
        </div>
      </div>
    )
  }
]);

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="teamforge-theme">
      <AuthProvider>  
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "hsl(var(--card))",
              color: "hsl(var(--card-foreground))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "12px",
            },
            success: { iconTheme: { primary: "hsl(var(--primary))", secondary: "hsl(var(--card))" } },
            error: { iconTheme: { primary: "#f87171", secondary: "hsl(var(--card))" } },
          }}
        />
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  );
}