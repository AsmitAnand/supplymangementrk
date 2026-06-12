import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "Owner" | "Administrator" | "Supply Chain Manager" | "Analyst" | "Viewer";
export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: Role;
  status: "active" | "invited" | "disabled";
  lastLogin?: string;
  createdAt: string;
}

const STORE_USERS = "smr.users";
const STORE_SESSION = "smr.session";
const STORE_AUDIT = "smr.audit";

const OWNER: User & { password: string } = {
  id: "USR-OWNER", username: "RITAM KHANDELWAL", name: "Ritam Khandelwal",
  email: "ritam@supplymind.research", role: "Owner", status: "active",
  createdAt: new Date().toISOString(), password: "RITAM123",
};

interface AuthCtx {
  user: User | null;
  users: (User & { password?: string })[];
  audit: { ts: string; actor: string; action: string; detail?: string }[];
  login: (u: string, p: string) => { ok: boolean; error?: string };
  logout: () => void;
  invite: (u: Partial<User> & { username: string; role: Role }) => string;
  setRole: (id: string, role: Role) => void;
  setStatus: (id: string, status: User["status"]) => void;
  resetPassword: (id: string) => string;
  can: (perm: string) => boolean;
}

const Ctx = createContext<AuthCtx | null>(null);

function load<T>(k: string, fb: T): T { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } }
function save(k: string, v: unknown) { localStorage.setItem(k, JSON.stringify(v)); }

const PERMS: Record<Role, string[]> = {
  Owner: ["*"],
  Administrator: ["view", "create", "edit", "delete", "export", "invite", "approve", "simulate"],
  "Supply Chain Manager": ["view", "create", "edit", "export", "simulate", "approve"],
  Analyst: ["view", "create", "edit", "export", "simulate"],
  Viewer: ["view"],
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<(User & { password?: string })[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [audit, setAudit] = useState<AuthCtx["audit"]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stored = load<(User & { password?: string })[]>(STORE_USERS, []);
    if (!stored.find((u) => u.username === OWNER.username)) {
      stored = [OWNER, ...stored];
      save(STORE_USERS, stored);
    }
    setUsers(stored);
    setAudit(load(STORE_AUDIT, []));
    const sid = load<string | null>(STORE_SESSION, null);
    if (sid) {
      const u = stored.find((x) => x.id === sid);
      if (u) setUser(u);
    }
    setReady(true);
  }, []);

  function pushAudit(action: string, detail?: string) {
    const entry = { ts: new Date().toISOString(), actor: user?.username ?? "system", action, detail };
    const next = [entry, ...audit].slice(0, 500);
    setAudit(next); save(STORE_AUDIT, next);
  }

  const value: AuthCtx = {
    user, users, audit,
    login: (u, p) => {
      const found = users.find((x) => x.username.toLowerCase() === u.toLowerCase() || x.email.toLowerCase() === u.toLowerCase());
      if (!found) return { ok: false, error: "Unknown user" };
      if (found.status !== "active") return { ok: false, error: "Account not active" };
      if (found.password !== p) return { ok: false, error: "Invalid credentials" };
      const updated = { ...found, lastLogin: new Date().toISOString() };
      const nextUsers = users.map((x) => (x.id === found.id ? updated : x));
      setUsers(nextUsers); save(STORE_USERS, nextUsers);
      setUser(updated); save(STORE_SESSION, updated.id);
      pushAudit("login", updated.username);
      return { ok: true };
    },
    logout: () => { pushAudit("logout"); setUser(null); localStorage.removeItem(STORE_SESSION); },
    invite: (u) => {
      const tempPwd = "TMP-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      const newU: User & { password: string } = {
        id: "USR-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
        username: u.username, name: u.name ?? u.username,
        email: u.email ?? `${u.username.toLowerCase()}@supplymind.research`,
        role: u.role, status: "active", createdAt: new Date().toISOString(),
        password: tempPwd,
      };
      const next = [...users, newU]; setUsers(next); save(STORE_USERS, next);
      pushAudit("invite", `${newU.username} as ${newU.role}`);
      return tempPwd;
    },
    setRole: (id, role) => {
      if (id === OWNER.id) return;
      const next = users.map((u) => (u.id === id ? { ...u, role } : u));
      setUsers(next); save(STORE_USERS, next); pushAudit("role-change", `${id} → ${role}`);
    },
    setStatus: (id, status) => {
      if (id === OWNER.id) return;
      const next = users.map((u) => (u.id === id ? { ...u, status } : u));
      setUsers(next); save(STORE_USERS, next); pushAudit("status-change", `${id} → ${status}`);
    },
    resetPassword: (id) => {
      const tempPwd = "RST-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      const next = users.map((u) => (u.id === id ? { ...u, password: tempPwd } : u));
      setUsers(next); save(STORE_USERS, next); pushAudit("password-reset", id);
      return tempPwd;
    },
    can: (perm) => {
      if (!user) return false;
      const perms = PERMS[user.role];
      return perms.includes("*") || perms.includes(perm);
    },
  };

  if (!ready) return null;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("AuthProvider missing");
  return c;
}
