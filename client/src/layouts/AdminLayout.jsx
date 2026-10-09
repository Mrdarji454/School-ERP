import { Outlet } from "react-router-dom";

import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import AcademicScopeProvider from "../context/AcademicScopeProvider";
import { NavLink } from "react-router-dom";
import { adminNavigation } from "../config/navigation";

const AdminLayout = () => {
  return (
    <AcademicScopeProvider><div className="flex h-dvh bg-slate-100">
      <Sidebar />

      <div className="min-w-0 flex-1 flex flex-col overflow-hidden">
        <Navbar />

        <details className="border-b bg-white px-4 py-3 md:hidden"><summary className="cursor-pointer font-medium text-slate-800">Admin navigation</summary><nav aria-label="Mobile admin navigation" className="mt-3 grid max-h-60 grid-cols-2 gap-2 overflow-y-auto">{adminNavigation.flatMap(group => group.items).map(item => <NavLink key={item.path} to={item.path} onClick={event => { event.currentTarget.closest("details").open = false; }} className={({ isActive }) => `rounded-lg p-3 text-sm ${isActive ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-800"}`}>{item.name}</NavLink>)}</nav></details>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div></AcademicScopeProvider>
  );
};

export default AdminLayout;
