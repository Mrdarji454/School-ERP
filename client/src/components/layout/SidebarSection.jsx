import SidebarItem from './SidebarItem';
export default function SidebarSection({ section, collapsed, onNavigate }) {
  return <section className="admin-nav-group"><h2 className={collapsed ? 'sr-only' : ''}>{section.title}</h2>{section.items.map(item => <SidebarItem key={item.path} item={item} collapsed={collapsed} onNavigate={onNavigate} />)}</section>;
}
