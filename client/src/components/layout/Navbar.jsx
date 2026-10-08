import { Bell } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { PanelLeft } from "lucide-react";
import { useLayout } from "../../context/LayoutContext";

const Navbar = () => {
  const { user } = useAuth();
  const { toggleSidebar } = useLayout();
  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>

        <p className="text-slate-500 text-sm">Welcome back, {user?.fullname}</p>
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-slate-100"
        >
          <PanelLeft />
        </button>
      </div>

      <div className="flex items-center gap-5">
        <button className="relative text-black  p-2 rounded-xl hover:bg-slate-100 ">
          <Bell size={22} />

          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500"></span>
        </button>

        <div className="h-11 w-11 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-lg">
          {user?.fullname?.charAt(0)}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
