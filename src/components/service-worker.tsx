"use client";

import { useEffect } from "react";

// Регистрирует service worker — включает офлайн-фолбэк и делает приложение
// устанавливаемым (PWA). Ничего не рендерит.
export function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onLoad = () =>
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Регистрация не критична — молча игнорируем (напр. приватный режим).
      });
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
