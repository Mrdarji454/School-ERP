import { createContext, useContext, useEffect, useState } from "react";

const LayoutContext = createContext();

export const LayoutProvider = ({ children }) => {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("sidebar") === "collapsed";
  });

  useEffect(() => {
    localStorage.setItem("sidebar", collapsed ? "collapsed" : "expanded");
  }, [collapsed]);

  const toggleSidebar = () => {
    setCollapsed((prev) => !prev);
  };

  return (
    <LayoutContext.Provider
      value={{
        collapsed,
        toggleSidebar,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => useContext(LayoutContext);
