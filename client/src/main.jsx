import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { LayoutProvider } from "./context/LayoutContext.jsx";

import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";

import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LayoutProvider>
          <App />
          <Toaster richColors />
        </LayoutProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
