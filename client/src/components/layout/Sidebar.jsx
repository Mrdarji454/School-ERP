import { NavLink } from "react-router-dom";
import { adminNavigation } from "../../config/navigation";
import { useLayout } from "../../context/LayoutContext";

const Sidebar = () => {
  const { collapsed } = useLayout();

  return (
    <aside
      className={`transition-all duration-300 ${collapsed ? "w-20" : "w-72"} bg-slate-950 text-white flex flex-col border-r border-slate-800`}
    >
      {/* Logo */}
      <div className="h-20 flex items-center justify-center border-b border-slate-800">
        <h1 className="text-2xl font-bold tracking-wide">School ERP</h1>
      </div>
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        {adminNavigation.map((section) => (
          <div key={section.title} className="mb-8">
            <p className="text-xs uppercase tracking-widest text-slate-500 mb-3 px-2">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200
                        ${
                          isActive
                            ? "bg-blue-600 text-white shadow-lg"
                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        }`
                    }
                  >
                    <Icon size={20} />
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-blue-400" />

                    <span className="font-medium">{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
