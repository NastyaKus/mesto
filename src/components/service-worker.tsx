"use client";

import { useEffect } from "react";

// Регистрирует service worker — включает офлайн-фолбэк и делает приложение
// устанавливаемым (PWA). Ничего не рендерит.
export function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const register = () =>
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Регистрация не критична — молча игнорируем (напр. приватный режим).
      });
    // Если страница уже загружена (частый случай при client-side навигации) —
    // регистрируем сразу; иначе ждём события load.
    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
