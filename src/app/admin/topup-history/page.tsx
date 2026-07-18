"use client";

import { useState, useEffect } from "react";

interface Topup {
  id: string;
  userId: string;
  amount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  user: {
    email: string;
    phone: string | null;
    name: string;
  };
}

export default function TopupHistoryPage() {
  const [topups, setTopups] = useState<Topup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchTopups = async (searchQuery: string = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/admin/topup-history?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal memuat data");
      const data = await res.json();
      setTopups(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopups();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTopups(search);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Riwayat Topup</h1>

      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Cari email atau nama user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 w-full max-w-md"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Cari
        </button>
        <button
          type="button"
          onClick={() => {
            setSearch("");
            fetchTopups();
          }}
          className="px-4 py-2 border rounded"
        >
          Reset
        </button>
      </form>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metode</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {topups.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3">{t.user.name}</td>
                  <td className="px-4 py-3">{t.user.email}</td>
                  <td className="px-4 py-3">{t.user.phone || "-"}</td>
                  <td className="px-4 py-3">Rp {t.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">{t.paymentMethod}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        t.status === "SUCCESS"
                          ? "bg-green-100 text-green-800"
                          : t.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {new Date(t.createdAt).toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}