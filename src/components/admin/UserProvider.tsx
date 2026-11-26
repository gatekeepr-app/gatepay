"use client";

import { createContext, useContext, type ReactNode } from "react";

type User = { _id: string; email: string; name?: string; role: string };
type AdminSession = { user: User; token: string };

const AdminSessionContext = createContext<AdminSession | null>(null);

export function AdminSessionProvider({ children, session }: { children: ReactNode; session: AdminSession }) {
  return <AdminSessionContext.Provider value={session}>{children}</AdminSessionContext.Provider>;
}

export function useAdminSession() {
  const session = useContext(AdminSessionContext);
  if (!session) throw new Error("useAdminSession must be used inside AdminSessionProvider");
  return session;
}
