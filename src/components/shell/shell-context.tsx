import { createContext, useContext, useState, type ReactNode } from "react";

interface ShellCtx { copilotOpen: boolean; toggleCopilot: () => void; setCopilot: (b: boolean) => void; }
const C = createContext<ShellCtx | null>(null);

export function ShellProvider({ children }: { children: ReactNode }) {
  const [copilotOpen, setCopilot] = useState(false);
  return <C.Provider value={{ copilotOpen, setCopilot, toggleCopilot: () => setCopilot(!copilotOpen) }}>{children}</C.Provider>;
}

export function useShell() {
  const c = useContext(C);
  if (!c) throw new Error("ShellProvider missing");
  return c;
}
