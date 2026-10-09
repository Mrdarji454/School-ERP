import { NavLink } from "react-router-dom";
import { adminNavigation } from "../../config/navigation";
import { useLayout } from "../../context/LayoutState";
export default function Sidebar() {
 const { collapsed } = useLayout();
 return <aside className={"hidden shrink-0 flex-col border-r border-slate-800 bg-slate-950 text-white transition-all md:flex " + (collapsed ? "w-20" : "w-64 xl:w-72")}>
  <div className="flex h-20 shrink-0 items-center justify-center border-b border-slate-800"><span className="text-xl font-bold">{collapsed ? "ERP" : "School ERP"}</span></div>
  <nav aria-label="Admin navigation" className="flex-1 overflow-y-auto px-3 py-5">{adminNavigation.map(group => <section key={group.title} className="mb-6"><h2 className={collapsed ? "sr-only" : "mb-3 px-3 text-xs uppercase tracking-widest text-slate-400"}>{group.title}</h2><div className="space-y-1">{group.items.map(item => { const Icon = item.icon; return <NavLink key={item.path} to={item.path} title={collapsed ? item.name : undefined} aria-label={item.name} className={({ isActive }) => "relative flex items-center gap-3 rounded-xl px-3 py-3 focus-visible:ring-2 focus-visible:ring-blue-400 " + (isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white")}><Icon size={20} className="shrink-0" /><span className={collapsed ? "sr-only" : "text-sm font-medium"}>{item.name}</span></NavLink>; })}</div></section>)}</nav>
 </aside>;
}
