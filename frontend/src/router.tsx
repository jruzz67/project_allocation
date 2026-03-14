import { createBrowserRouter } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Projects from "./pages/Projects";
import AllocationResult from "./pages/AllocationResult";

export const router = createBrowserRouter([
  { path: "/", element: <Dashboard /> },
  { path: "/employees", element: <Employees /> },
  { path: "/projects", element: <Projects /> },
  { path: "/projects/:id/allocate", element: <AllocationResult /> },
]);