import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { useLayout } from "../../context/LayoutState";

const SidebarItem = ({ item }) => {
  const { collapsed } = useLayout();

  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `
                group
                relative
                flex
                items-center
                gap-3
                rounded-xl
                px-3
                py-3
                transition-all
                duration-200

                ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800"
                }
                `
      }
    >
      <Icon size={20} />

      {!collapsed && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-medium"
        >
          {item.name}
        </motion.span>
      )}
    </NavLink>
  );
};

export default SidebarItem;
