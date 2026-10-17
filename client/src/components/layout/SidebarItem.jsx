import { NavLink } from 'react-router-dom';
export default function SidebarItem({ item, collapsed = false, onNavigate }) {
  const Icon = item.icon;
  return <NavLink to={item.path} onClick={onNavigate} title={collapsed ? item.name : undefined} aria-label={item.name} className={({ isActive }) => `admin-nav-item${isActive ? ' active' : ''}`}><Icon size={19} aria-hidden="true" /><span className={collapsed ? 'sr-only' : ''}>{item.name}</span></NavLink>;
}
