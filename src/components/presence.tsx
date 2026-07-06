"use client";

import { useEffect } from "react";

const HEARTBEAT_MS = 45_000;

// Пингует /api/presence, поддерживая онлайн-статус пользователя.
// Бьётся при монтировании, по таймеру и при возврате фокуса на вкладку.
export function Presence() {
  useEffect(() => {
    let active = true;
    const ping = () => {
      if (!active || document.visibilityState === "hidden") return;
      fetch("/api/presence", { method: "POST" }).catch(() => {});
    };

    ping();
    const timer = setInterval(ping, HEARTBEAT_MS);
    document.addEventListener("visibilitychange", ping);
    window.addEventListener("focus", ping);

    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", ping);
      window.removeEventListener("focus", ping);
    };
  }, []);

  return null;
}
