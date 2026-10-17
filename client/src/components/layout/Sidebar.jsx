import { adminNavigation } from '../../config/navigation';
import { useLayout } from '../../context/LayoutState';
import { useAuth } from '../../context/AuthState';
import SidebarSection from './SidebarSection';
import logo from '../../assets/vedantLogo.png';
export default function Sidebar({ mobile = false, onNavigate }) {
  const { collapsed } = useLayout(), { user } = useAuth(), compact = !mobile && collapsed;
  return <aside id={mobile ? undefined : 'admin-sidebar'} className={`admin-sidebar${mobile ? ' mobile' : ''}${compact ? ' compact' : ''}`}>
    <div className="admin-brand"><img src={logo} alt="Vedant Vidhya Sankul logo" /><div className={compact ? 'sr-only' : ''}><strong>Vedant Vidhya</strong><span>Sankul / School ERP</span></div></div>
    <nav aria-label={mobile ? 'Mobile Admin navigation' : 'Admin navigation'}>{adminNavigation.map(section => <SidebarSection key={section.title} section={section} collapsed={compact} onNavigate={onNavigate} />)}</nav>
    <div className="admin-sidebar-account"><span className="admin-avatar" aria-hidden="true">{user?.fullname?.slice(0, 1)}</span><div className={compact ? 'sr-only' : 'min-w-0'}><strong className="block truncate">{user?.fullname}</strong><span>{user?.role}</span></div></div>
  </aside>;
}
