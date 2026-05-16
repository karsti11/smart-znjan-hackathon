"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Role, User } from "./types";
import { api } from "./api";

interface RoleState {
  user: User | null;
  role: Role;
  allUsers: User[];
  loading: boolean;
  switchTo: (userId: string) => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<RoleState | null>(null);

const STORAGE_KEY = "smart-znjan-active-user";

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const users = await api.listUsers();
      setAllUsers(users);

      const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      const initial = stored && users.find((u) => u.id === stored)
        ? stored
        : users.find((u) => u.role === "citizen")?.id ?? users[0]?.id ?? null;
      setActiveId(initial);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const switchTo = useCallback((userId: string) => {
    setActiveId(userId);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, userId);
  }, []);

  const refresh = useCallback(async () => {
    if (!activeId) return;
    try {
      const u = await api.getUser(activeId);
      setAllUsers((prev) => prev.map((x) => (x.id === u.id ? u : x)));
    } catch {
      /* ignore */
    }
  }, [activeId]);

  const value = useMemo<RoleState>(() => {
    const user = allUsers.find((u) => u.id === activeId) ?? null;
    return {
      user,
      role: user?.role ?? "citizen",
      allUsers,
      loading,
      switchTo,
      refresh,
    };
  }, [allUsers, activeId, loading, switchTo, refresh]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRole() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useRole must be used within RoleProvider");
  return v;
}
