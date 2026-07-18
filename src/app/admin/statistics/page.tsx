"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface StatisticsData {
  revenue: { month: string; pendapatan: number }[];
  activeUsers: { date: string; logins: number }[];
  topServices: { name: string; count: number }[];
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export default function StatisticsPage() {
  const [data, setData] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/admin/statistics");
        if (!res.ok) throw new Error("Gagal memuat statistik");
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <p className="p-4">Memuat data statistik...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;
  if (!data) return null;

  return (
    <div className="p-4 space-y-8">
      <h1 className="text-2xl font-bold">Statistik</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pendapatan Bulanan */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-2">Pendapatan Bulanan (Topup + Order Complete)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.revenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => `Rp ${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="pendapatan" fill="#0088FE" name="Pendapatan" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* User Aktif (Login) */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-2">User Login 7 Hari Terakhir</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.activeUsers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="logins" stroke="#00C49F" name="Login" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Layanan Terlaris */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-2">Layanan Terlaris</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.topServices}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => entry.name}
              >
                {data.topServices.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `${value} order`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}