import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { LayoutProvider } from "./context/LayoutContext.jsx";

import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";

import "./index.css";

const router = createBrowserRouter([{ path: '*', element: (
      <AuthProvider>
        <LayoutProvider>
          <App />
          <Toaster richColors />
        </LayoutProvider>
      </AuthProvider>
)}]);
createRoot(document.getElementById('root')).render(<StrictMode><RouterProvider router={router} /></StrictMode>);
