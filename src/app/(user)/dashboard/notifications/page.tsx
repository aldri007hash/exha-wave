"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  if (!session?.user) redirect("/login");

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => setNotifications(data.notifications || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-4">Memuat notifikasi...</p>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-heading text-2xl font-bold mb-6">Semua Notifikasi</h1>
      {notifications.length === 0 ? (
        <p className="text-gray-500">Belum ada notifikasi.</p>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-xl border ${notif.isRead ? "bg-white" : "bg-blue-50 border-blue-200"}`}
            >
              <h3 className="font-semibold">{notif.title}</h3>
              <p className="text-sm text-gray-600">{notif.message}</p>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(notif.createdAt).toLocaleString("id-ID")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}