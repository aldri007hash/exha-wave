import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import RootLayoutClient from "@/components/RootLayoutClient";

export const metadata: Metadata = {
  title: "Exha Wave - SMM Panel Indonesia",
  description:
    "Jasa like, view, follower, comment, share, save TikTok, Instagram, Facebook, X, YouTube dan lainnya.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0066FF",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = localStorage.getItem('theme') || 'light';
                document.documentElement.setAttribute('data-theme', theme);
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-background text-foreground">
        <Providers>
          <RootLayoutClient>{children}</RootLayoutClient>
        </Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').then(
                    (registration) => console.log('SW registered: ', registration.scope),
                    (err) => console.log('SW registration failed: ', err)
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}