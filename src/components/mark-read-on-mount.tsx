"use client";

import { useEffect } from "react";
import { markNotificationsRead } from "@/lib/actions/notifications";

// Помечает уведомления прочитанными при открытии страницы (сбрасывает бейдж).
export function MarkReadOnMount() {
  useEffect(() => {
    markNotificationsRead();
  }, []);
  return null;
}
