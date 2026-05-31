"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { getStoredToken } from "@/integrations/convex/auth";

type User = { _id: string; email: string; name?: string; role: string };

const UserContext = createContext<User | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const getMe = useMutation(api.auth.getMe);
  const token = getStoredToken();

  useEffect(() => {
    if (!token) return;
    getMe({ token }).then(setUser).catch(() => {});
  }, [token]);

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
