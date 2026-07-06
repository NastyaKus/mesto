/* eslint-disable @next/next/no-img-element */

type Props = {
  src?: string | null;
  name: string;
  size?: number;
  // Зелёная точка «в сети». undefined — не показываем индикатор вовсе.
  online?: boolean;
};

// Аватар пользователя. Если картинки нет — показываем инициалы на синем фоне.
// При online != undefined в углу рисуем индикатор присутствия.
export function Avatar({ src, name, size = 40, online }: Props) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const inner = src ? (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      className="rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className="bg-brand-gradient flex items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  );

  if (online === undefined) return inner;

  // Точка присутствия: ~28% от размера аватара, в правом нижнем углу.
  const dot = Math.max(9, Math.round(size * 0.28));
  return (
    <span className="relative inline-block" style={{ width: size, height: size }}>
      {inner}
      {online && (
        <span
          className="absolute right-0 bottom-0 rounded-full bg-green-500 ring-2 ring-surface"
          style={{ width: dot, height: dot }}
          title="в сети"
        />
      )}
    </span>
  );
}
