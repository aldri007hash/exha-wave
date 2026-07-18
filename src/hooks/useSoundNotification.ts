"use client";
import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

let lastNotificationId: string | null = null;

export function useSoundNotification() {
  const { data: session } = useSession();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!session?.user) return;

    const checkNewNotifications = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const data = await res.json();
        const notifications = data.notifications || [];

        // Ambil suara dari API publik
        const soundRes = await fetch("/api/sounds");
        const soundData = await soundRes.json();
        const sounds = soundData.sounds || [];

        const latestNotif = notifications[0];
        if (latestNotif && latestNotif.id !== lastNotificationId) {
          lastNotificationId = latestNotif.id;

          let category = "";
          if (
            latestNotif.title.includes("Pesanan Baru") ||
            latestNotif.title.includes("Order Baru")
          ) {
            category = "pesanan_baru";
          } else if (
            latestNotif.title.includes("Status") ||
            latestNotif.title.includes("status")
          ) {
            category = "perubahan_status";
          } else if (
            latestNotif.title.includes("Chat") ||
            latestNotif.title.includes("chat")
          ) {
            category = "pesan_chat";
          } else if (
            latestNotif.title.includes("Topup") ||
            latestNotif.title.includes("Top up") ||
            latestNotif.title.includes("topup")
          ) {
            category = "topup_saldo";
          }

          const isAdmin =
            session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
          const isForCurrentUser =
            latestNotif.userId && latestNotif.userId === session.user.id;

          const adminOnlyCategories = ["pesanan_baru", "pesan_chat"];

          if (adminOnlyCategories.includes(category) && !isAdmin) {
            return;
          }

          if (
            (category === "perubahan_status" || category === "topup_saldo") &&
            !isAdmin &&
            !isForCurrentUser
          ) {
            return;
          }

          const matchedSound = sounds.find(
            (s: any) => s.category === category
          );
          if (matchedSound) {
            if (audioRef.current) {
              audioRef.current.src = matchedSound.fileUrl;
              audioRef.current.play().catch(console.error);
            }
          }
        }
      } catch (error) {
        console.error("Error checking notifications:", error);
      }
    };

    checkNewNotifications();
    const interval = setInterval(checkNewNotifications, 10000);
    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
}