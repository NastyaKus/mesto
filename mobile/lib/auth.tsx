import React, { createContext, useContext, useEffect, useState } from "react";
import { api, PublicUser, setApiToken } from "./api";
import { loadToken, saveToken, clearToken } from "./storage";

type AuthState = {
  user: PublicUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (body: {
    email: string;
    username: string;
    displayName: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthState>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Автологин по сохранённому токену.
  useEffect(() => {
    (async () => {
      const t = await loadToken();
      if (t) {
        setApiToken(t);
        try {
          const { user } = await api.me();
          setUser(user);
        } catch {
          setApiToken(null);
          await clearToken();
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const { token, user } = await api.login(email, password);
    setApiToken(token);
    await saveToken(token);
    setUser(user);
  };

  const register: AuthState["register"] = async (body) => {
    const { token, user } = await api.register(body);
    setApiToken(token);
    await saveToken(token);
    setUser(user);
  };

  const logout = async () => {
    setApiToken(null);
    await clearToken();
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
