import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getThemePref } from "@/lib/theme";
import { ServiceWorker } from "@/components/service-worker";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "mesto — социальная сеть",
  description: "mesto — место, где вы на связи",
  applicationName: "mesto",
  appleWebApp: {
    capable: true,
    title: "mesto",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  // Цвет системной панели: фирменный на светлой, тёмная поверхность на тёмной.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#6c5ce7" },
    { media: "(prefers-color-scheme: dark)", color: "#191a20" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Тема из cookie. Явный выбор пишем в data-theme (без вспышки);
  // «системный» режим оставляет атрибут пустым — за тему отвечает CSS-медиазапрос.
  const pref = await getThemePref();
  const themeAttr = pref === "system" ? {} : { "data-theme": pref };

  return (
    <html
      lang="ru"
      {...themeAttr}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
