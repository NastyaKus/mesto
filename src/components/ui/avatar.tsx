/* eslint-disable @next/next/no-img-element */

type Props = {
  src?: string | null;
  name: string;
  size?: number;
};

// Аватар пользователя. Если картинки нет — показываем инициалы на синем фоне.
export function Avatar({ src, name, size = 40 }: Props) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="bg-brand-gradient flex items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  );
}
