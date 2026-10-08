import { useLocation } from "react-router-dom";

import Navbar from "./components/navbar.jsx";
import Footer from "./components/Footer.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";

function AppContent() {
  const location = useLocation();
  const hideLayout =
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/admin");

  return (
    <>
      <ScrollToTop />
      {!hideLayout && <Navbar />}
      <AppRoutes />
      {!hideLayout && <Footer />}
    </>
  );
}

function App() {
  return <AppContent />;
}

export default App;
