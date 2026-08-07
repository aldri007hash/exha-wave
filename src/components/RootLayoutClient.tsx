"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppFloating from "@/components/WhatsAppFloating";
import SplashScreen from "@/components/SplashScreen";
import AOSInit from "@/components/AOSInit";
import SmoothScroll from "@/components/SmoothScroll";
import VisitorTracker from "@/components/VisitorTracker";
import MobileBottomNav from "@/components/MobileBottomNav";
import ProgressBar from "@/components/ProgressBar";
import PageTransition from "@/components/PageTransition";
import SoundNotifInit from "@/components/SoundNotifInit";
import PushNotificationPrompt from "@/components/PushNotificationPrompt";
import BroadcastOverlay from "@/components/BroadcastOverlay";

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const isLoginPage = pathname === "/login";

  if (isAdmin) {
    return (
      <>
        <ProgressBar />
        <SoundNotifInit />
        <VisitorTracker />
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
      <SoundNotifInit />
      <VisitorTracker />
      <BroadcastOverlay />
      {status !== "loading" && !isLoginPage && <Header />}
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      {status !== "loading" && !isLoginPage && <Footer />}
      {status !== "loading" && !isLoginPage && <WhatsAppFloating />}
      {status !== "loading" && !isLoginPage && <MobileBottomNav />}
      {status !== "loading" && !isLoginPage && <PushNotificationPrompt />}
    </>
  );
}
