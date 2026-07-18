"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

interface Activity {
  id: string;
  adminEmail: string;
  adminName: string;
  action: string;
  ip: string;
  userAgent: string;
  timestamp: string;
}

interface DashboardData {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  recentActivities: Activity[];
}

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/dashboard");
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 100)}`);
      }
      const json: DashboardData = await res.json();
      setData(json);
      setError("");
    } catch (err: any) {
      setError(err.message || "Gagal memuat dashboard");
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    // Polling setiap 10 detik untuk activity log realtime
    const interval = setInterval(fetchDashboard, 10000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Memuat dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-medium">Gagal memuat dashboard</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-sm underline"
          >
            Coba lagi
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Admin</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Total User</p>
          <p className="text-2xl font-bold">{data.totalUsers}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Total Pesanan</p>
          <p className="text-2xl font-bold">{data.totalOrders}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Pendapatan (Topup Sukses)</p>
          <p className="text-2xl font-bold">
            Rp {data.totalRevenue.toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Aktivitas Login Admin</h2>
        {data.recentActivities.length === 0 ? (
          <p className="text-gray-400">Belum ada aktivitas login</p>
        ) : (
          <ul className="space-y-2">
            {data.recentActivities.map((act) => (
              <li key={act.id} className="text-sm border-b pb-1">
                <span className="font-medium">{act.adminEmail}</span> ({act.adminName}) -{" "}
                {act.action} -{" "}
                {new Date(act.timestamp).toLocaleString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {act.ip && act.ip !== "unknown" && <span> (IP: {act.ip})</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}