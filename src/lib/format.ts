// Относительное время на русском: «только что», «5 мин назад», «3 ч назад»…
export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

  if (seconds < 60) return "только что";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} ${plural(minutes, "мин", "мин", "мин")} назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${plural(hours, "час", "часа", "часов")} назад`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ${plural(days, "день", "дня", "дней")} назад`;

  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
}

// Статус присутствия: «в сети» или «был(а) в сети N назад».
export function presenceLabel(
  lastSeenAt: Date | string | null,
  online: boolean,
): string {
  if (online) return "в сети";
  if (!lastSeenAt) return "не в сети";
  return `был(а) ${timeAgo(lastSeenAt)}`;
}

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
