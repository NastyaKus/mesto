"use client";

import { useEffect, useState } from "react";

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

type Status = "loading" | "unsupported" | "off" | "on" | "denied" | "busy";

// Тумблер веб-уведомлений: подписка/отписка на push через service worker.
export function PushToggle() {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Ждём микротик, чтобы не звать setState синхронно в теле эффекта.
      await Promise.resolve();
      if (cancelled) return;
      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !VAPID
      ) {
        setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!cancelled) setStatus(sub ? "on" : "off");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const enable = async () => {
    setStatus("busy");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setStatus(perm === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID) as BufferSource,
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      setStatus(res.ok ? "on" : "off");
    } catch {
      setStatus("off");
    }
  };

  const disable = async () => {
    setStatus("busy");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus("off");
    } catch {
      setStatus("on");
    }
  };

  return (
    <div className="card animate-fade-up mt-4 flex items-center justify-between p-4">
      <div className="min-w-0">
        <div className="font-medium">🔔 Push-уведомления</div>
        <div className="text-sm text-muted">
          {status === "unsupported" && "Браузер не поддерживает уведомления."}
          {status === "denied" && "Уведомления заблокированы в настройках браузера."}
          {(status === "on" || status === "off" || status === "busy" || status === "loading") &&
            "Получать уведомления о новых сообщениях."}
        </div>
      </div>
      <button
        type="button"
        disabled={status === "loading" || status === "busy" || status === "unsupported" || status === "denied"}
        onClick={status === "on" ? disable : enable}
        className={`press shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
          status === "on" ? "btn-ghost" : "btn-primary text-white"
        }`}
      >
        {status === "busy" || status === "loading" ? (
          <span className="spinner" />
        ) : status === "on" ? (
          "Выключить"
        ) : (
          "Включить"
        )}
      </button>
    </div>
  );
}
