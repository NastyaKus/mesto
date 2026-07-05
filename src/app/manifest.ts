import type { MetadataRoute } from "next";

// Манифест PWA — делает mesto устанавливаемым как приложение.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "mesto — социальная сеть",
    short_name: "mesto",
    description: "mesto — место, где вы на связи",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f5fa",
    theme_color: "#6c5ce7",
    lang: "ru",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
