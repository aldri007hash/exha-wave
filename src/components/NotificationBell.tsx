"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { Bell } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifs = useCallback(async () => {
    if (!session?.user) return;
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error(err);
    }
  }, [session]);

  // Polling 15 detik untuk notifikasi baru
  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  // Tandai semua read saat dropdown ditutup
  useEffect(() => {
    if (!open) {
      // Panggil API mark read hanya jika ada notifikasi unread
      if (notifications.some((n) => !n.isRead)) {
        fetch("/api/notifications", { method: "PUT" })
          .then(() => fetchNotifs()) // Refresh data setelah mark read
          .catch(console.error);
      }
    }
  }, [open]);

  // Klik di luar menutup dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="relative p-2 hover:bg-card rounded-full"
        onClick={() => setOpen(!open)}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl p-4 max-h-80 overflow-y-auto z-50">
          <h4 className="font-semibold mb-2">Notifikasi</h4>
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada notifikasi.</p>
          ) : (
            notifications.slice(0, 10).map((notif) => (
              <div
                key={notif.id}
                className={`p-2 rounded-lg mb-1 text-sm ${
                  notif.isRead ? "" : "bg-blue-50 dark:bg-blue-900/20"
                }`}
              >
                <p className="font-medium">{notif.title}</p>
                <p className="text-gray-600 dark:text-gray-300">{notif.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(notif.createdAt).toLocaleString("id-ID")}
                </p>
                {notif.isRead && (
                  <p className="text-xs text-green-500 mt-1">✔ Sudah dibaca</p>
                )}
              </div>
            ))
          )}
          <Link
            href="/dashboard/notifications"
            className="block text-center text-sm text-primary mt-2 hover:underline"
            onClick={() => setOpen(false)}
          >
            Lihat semua
          </Link>
        </div>
      )}
    </div>
  );
}