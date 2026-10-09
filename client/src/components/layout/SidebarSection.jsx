import SidebarItem from "./SidebarItem";
import { useLayout } from "../../context/LayoutState";

const SidebarSection = ({ section }) => {
  const { collapsed } = useLayout();

  return (
    <div className="mb-8">
      {!collapsed && (
        <p
          className="
                    mb-3
                    px-2
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-[0.2em]
                    text-slate-500
                    "
        >
          {section.title}
        </p>
      )}

      <div className="space-y-1">
        {section.items.map((item) => (
          <SidebarItem key={item.path} item={item} />
        ))}
      </div>
    </div>
  );
};

export default SidebarSection;
