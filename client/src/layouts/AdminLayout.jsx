import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { isAcademicPath } from '../utils/academicPresentation';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Modal from '../components/modal/Modal';
import AcademicScopeProvider from '../context/AcademicScopeProvider';
import '../styles/admin.css';
export default function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const academic = isAcademicPath(useLocation().pathname);
  useEffect(() => { const query = window.matchMedia('(min-width: 1101px)'); const closeOnDesktop = () => { if (query.matches) setDrawerOpen(false); }; query.addEventListener('change', closeOnDesktop); return () => query.removeEventListener('change', closeOnDesktop); }, []);
  return <AcademicScopeProvider><div className={`admin-shell${academic ? ' admin-academic-shell' : ''}`}><a className="admin-skip-link" href="#admin-main">Skip to content</a><Sidebar academic={academic} /><div className="admin-workspace"><Navbar academic={academic} drawerOpen={drawerOpen} onOpenNavigation={() => setDrawerOpen(true)} /><main id="admin-main" tabIndex={-1} className="admin-main"><div className="admin-content"><Outlet /></div></main></div><Modal id="admin-navigation-drawer" className="admin-drawer" isOpen={drawerOpen} title="Admin navigation" onClose={() => setDrawerOpen(false)}><Sidebar academic={academic} mobile onNavigate={() => setDrawerOpen(false)} /></Modal></div></AcademicScopeProvider>;
}
