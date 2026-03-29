import { createContext, useContext, useState, ReactNode } from "react";

interface SessionContextType {
  sessionId: string;
}

const SessionContext = createContext<SessionContextType | null>(null);

function generateSessionId(): string {
  return "sess_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessionId] = useState<string>(generateSessionId);

  return (
    <SessionContext.Provider value={{ sessionId }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
