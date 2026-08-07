import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Providers } from "@/components/Providers"
import RootLayoutClient from "@/components/RootLayoutClient"

export const dynamic = 'force-dynamic'
export const metadataBase = new URL("https://exhawave.com")

export const metadata: Metadata = {
  title: "Exha Wave - SMM Panel Indonesia | Jasa Buzzer Murah & Berkualitas",
  description: "Exha Wave menyediakan jasa buzzer, like, view, follower, comment, share, save untuk TikTok, Instagram, Facebook, YouTube. Jasa buzzer murah, buzzer Indonesia terpercaya.",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "32x32" }],
    apple: { url: "/logo.png", sizes: "180x180", type: "image/png" },
    other: [
      { url: "/logo.png", sizes: "192x192", type: "image/png" },
      { url: "/logo.png", sizes: "512x512", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Exha Wave - Jasa Buzzer Murah & Berkualitas",
    description: "Jasa buzzer Indonesia untuk TikTok, Instagram, Facebook, YouTube.",
    url: "https://exhawave.com",
    siteName: "Exha Wave",
    images: [{ url: "https://exhawave.com/logo.png", width: 512, height: 512 }],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Exha Wave - Jasa Buzzer Murah & Berkualitas",
    description: "Jasa buzzer Indonesia untuk TikTok, Instagram, Facebook, YouTube.",
    images: ["https://exhawave.com/logo.png"],
  },
}

export const viewport: Viewport = {
  themeColor: "#0066FF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
              var savedTheme = localStorage.getItem('theme');
              if (savedTheme) {
                document.documentElement.setAttribute('data-theme', savedTheme);
              } else {
                var hour = new Date().getHours();
                var autoTheme = (hour >= 18 || hour < 6) ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', autoTheme);
                localStorage.setItem('theme', autoTheme);
              }
            })();`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-background text-foreground">
        <Providers>
          <RootLayoutClient>{children}</RootLayoutClient>
        </Providers>
      </body>
    </html>
  )
}
