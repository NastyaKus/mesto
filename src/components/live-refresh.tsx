"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Живое обновление серверных данных текущего маршрута (список чатов, лента,
// бейджи навигации) через router.refresh по таймеру — только пока вкладка видима.
// Окно чата опрашивает сервер отдельно (снаппи внутри диалога).
export function LiveRefresh({ intervalMs = 4000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const timer = setInterval(tick, intervalMs);
    // При возврате на вкладку — обновиться сразу.
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
    };
  }, [router, intervalMs]);

  return null;
}
