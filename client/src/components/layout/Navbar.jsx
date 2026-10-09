import { PanelLeft } from "lucide-react";
import { useAuth } from "../../context/AuthState";
import { useLayout } from "../../context/LayoutState";
import { useLocation, useNavigate } from "react-router-dom";
import { adminNavigation } from "../../config/navigation";
export default function Navbar() {
 const { user, logoutUser } = useAuth(), { toggleSidebar, collapsed } = useLayout();
 const navigate = useNavigate(), location = useLocation();
 const title = adminNavigation.flatMap(group => group.items).find(item => item.path === location.pathname)?.name || "School ERP";
 return <header className="flex min-h-20 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
  <div className="flex min-w-0 items-center gap-3"><button type="button" aria-label="Toggle sidebar" aria-expanded={!collapsed} onClick={toggleSidebar} className="hidden rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:block"><PanelLeft /></button><div className="min-w-0"><h2 className="truncate text-lg font-bold text-slate-900 sm:text-xl">{title}</h2><p className="truncate text-sm text-slate-500">{user?.fullname}</p></div></div>
  <button type="button" className="shrink-0 rounded-lg border px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => { if (window.dispatchEvent(new Event('erp:before-logout', { cancelable: true }))) { logoutUser(); navigate("/login", { replace: true }); } }}>Log out</button>
 </header>;
}
