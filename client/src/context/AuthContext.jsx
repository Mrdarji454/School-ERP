import api from "../services/api";
import { useEffect, useState } from "react";

import { AuthContext } from "./AuthState";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const clear = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); if (active) setUser(null); };
    window.addEventListener("auth:invalid", clear);
    const token = localStorage.getItem("token");
    Promise.resolve().then(async () => {
      if (!token) return;
      try { const { data } = await api.get("/auth/me"); if (active) setUser(data.data); }
      catch { clear(); }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; window.removeEventListener("auth:invalid", clear); };
  }, []);

  const loginUser = (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    setUser(user);
  };

  const logoutUser = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginUser,
        logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
