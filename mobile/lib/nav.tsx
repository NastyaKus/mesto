import React, { createContext, useCallback, useContext, useState } from "react";

export type Route = { name: string; params?: Record<string, any> };

type NavState = {
  route: Route;
  canGoBack: boolean;
  navigate: (name: string, params?: Record<string, any>) => void;
  back: () => void;
};

const Ctx = createContext<NavState>({
  route: { name: "" },
  canGoBack: false,
  navigate: () => {},
  back: () => {},
});

export function NavProvider({
  initial,
  children,
}: {
  initial: Route;
  children: React.ReactNode;
}) {
  const [stack, setStack] = useState<Route[]>([initial]);
  const navigate = useCallback(
    (name: string, params?: Record<string, any>) =>
      setStack((s) => [...s, { name, params }]),
    [],
  );
  const back = useCallback(
    () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
    [],
  );
  const route = stack[stack.length - 1];
  return (
    <Ctx.Provider
      value={{ route, canGoBack: stack.length > 1, navigate, back }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useNav = () => useContext(Ctx);
