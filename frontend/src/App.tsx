// src/App.tsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// Pages
import Landing from "./pages/Landing";           // ← new home
import Projects from "./pages/Projects";
import Employees from "./pages/Employees";
import AllocatePage from "./pages/AllocatePage";
import ProjectTeam from "./pages/ProjectTeam";

const router = createBrowserRouter([
  { path: "/", element: <Landing /> },           // Landing as root
  { path: "/employees", element: <Employees /> },
  { path: "/projects", element: <Projects /> },
  { path: "/projects/:project_id/allocate", element: <AllocatePage /> },
  { path: "/projects/:project_id/team", element: <ProjectTeam /> },

  // 404
  {
    path: "*",
    element: (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <h1 className="text-8xl font-bold text-red-500 mb-6">404</h1>
          <p className="text-3xl mb-8">Page Not Found</p>
          <a href="/" className="text-violet-400 hover:underline text-xl">Back to Home</a>
        </div>
      </div>
    ),
  },
]);

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white antialiased">
      <RouterProvider router={router} />
    </div>
  );
}