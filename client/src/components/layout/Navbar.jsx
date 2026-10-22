import { Menu, PanelLeft, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthState';
import { useLayout } from '../../context/LayoutState';
import { useAcademicScope } from '../../context/AcademicScopeState';
import { useLocation, useNavigate } from 'react-router-dom';
import { adminNavigation } from '../../config/navigation';
import { dashboardYear } from '../../utils/adminDashboard';
import useSchoolClock from '../../hooks/useSchoolClock';
export default function Navbar({ onOpenNavigation, drawerOpen, academic = false }) {
  const { user, logoutUser } = useAuth(), { toggleSidebar, collapsed } = useLayout(), scope = useAcademicScope();
  const navigate = useNavigate(), location = useLocation(), clock = useSchoolClock(scope.workflow?.timeZone);
  const title = academic ? 'School administration' : adminNavigation.flatMap(group => group.items).find(item => item.path === location.pathname)?.name || 'School ERP';
  const year = dashboardYear(scope);
  return <header className="admin-topbar">
    <div className="admin-header-title"><button type="button" className="admin-icon-button admin-mobile-toggle" aria-label="Open Admin navigation" aria-expanded={drawerOpen} aria-controls="admin-navigation-drawer" onClick={onOpenNavigation}><Menu size={21} /></button><button type="button" className="admin-icon-button admin-desktop-toggle" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!collapsed} aria-controls="admin-sidebar" onClick={toggleSidebar}><PanelLeft size={21} /></button><div><p className="font-semibold">{title}</p><span className="admin-header-caption">School administration</span></div></div>
    <div className="admin-header-controls">{location.pathname === '/admin/dashboard' && <label className="admin-year-select"><span>Academic year</span><select aria-label="Academic year" disabled={scope.loading || Boolean(scope.error)} value={year} onChange={e => scope.setYear(e.target.value)}><option value="">Choose active year</option>{scope.options.years.map(y => <option key={y._id} value={y._id} disabled={!y.isActive}>{y.name}{y.isActive ? '' : ' (inactive)'}</option>)}</select></label>}<div className="admin-school-date">{clock && <><strong>{clock.label}</strong><span>{scope.workflow.timeZone}</span></>}</div><div className="admin-header-profile"><span className="admin-avatar" aria-hidden="true">{user?.fullname?.slice(0, 1)}</span><div><strong>{user?.fullname}</strong><span>{user?.role}</span></div></div><button type="button" className="admin-icon-button" aria-label="Log out" title="Log out" onClick={() => { if (window.dispatchEvent(new Event('erp:before-logout', { cancelable: true }))) { logoutUser(); navigate('/login', { replace: true }); } }}><LogOut size={18} /></button></div>
  </header>;
}
