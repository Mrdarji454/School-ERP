import { createContext, useContext } from "react";
export const AcademicScopeContext = createContext(null);
export const useAcademicScope = () => useContext(AcademicScopeContext);
