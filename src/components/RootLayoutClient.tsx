"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppFloating from "@/components/WhatsAppFloating";
import SplashScreen from "@/components/SplashScreen";
import AOSInit from "@/components/AOSInit";
import SmoothScroll from "@/components/SmoothScroll";
import SoundNotifier from "@/components/SoundNotifier";
import VisitorTracker from "@/components/VisitorTracker";
import MobileBottomNav from "@/components/MobileBottomNav";
import ProgressBar from "@/components/ProgressBar";
import PageTransition from "@/components/PageTransition";
import SoundNotifInit from "@/components/soundnotifinit";

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Strict isolation: only exact /admin or sub-routes like /admin/...
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const isLoginPage = pathname === "/login";

  if (isAdmin) {
    return (
      <>
        <ProgressBar />
        <SoundNotifier />
        <SoundNotifInit />
        <VisitorTracker />
        {/* Children rendered directly without extra <main> wrapper */}
        {children}
      </>
    );
  }

  return (
    <>
      <ProgressBar />
      <SmoothScroll />
      <AOSInit />
      <SplashScreen />
      <SoundNotifier />
      <SoundNotifInit />
      <VisitorTracker />
      {!isLoginPage && <Header />}
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      {!isLoginPage && <Footer />}
      {!isLoginPage && <WhatsAppFloating />}
      {!isLoginPage && <MobileBottomNav />}
    </>
  );
}