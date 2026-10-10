import { createContext, useContext, type ReactNode } from "react";
import type { Me } from "../types";
import { api } from "./api";
import { useAsync } from "./useAsync";

const MeContext = createContext<Me | undefined>(undefined);

// The SPA cannot read the httpOnly session cookie, so it asks the backend who the caller
// is. Used ONLY to hide buttons the user could not use anyway — the backend still checks
// roles on every request.
export function MeProvider({ children }: { children: ReactNode }) {
  const { data } = useAsync(() => api.me(), []);
  return <MeContext.Provider value={data}>{children}</MeContext.Provider>;
}

export function useCan() {
  const me = useContext(MeContext);
  const has = (...roles: string[]) => !!me && me.roles.some((r) => roles.includes(r));
  return {
    me,
    canWrite: has("Accountant", "Admin"),
    canClosePeriod: has("Admin"),
  };
}
