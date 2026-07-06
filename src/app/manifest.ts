import type { MetadataRoute } from "next";

// Манифест PWA — делает mesto устанавливаемым как приложение.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "mesto — социальная сеть",
    short_name: "mesto",
    description: "mesto — место, где вы на связи",
    start_url: "/feed",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4f5fa",
    theme_color: "#6c5ce7",
    lang: "ru",
    categories: ["social"],
    icons: [
      // SVG — векторная, для браузеров с поддержкой (масштабируется без потерь).
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      // PNG — фолбэк для платформ без SVG (в т.ч. критерий установки в Chrome).
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Maskable — буква в безопасной зоне, ОС сама обрезает под свою форму.
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
