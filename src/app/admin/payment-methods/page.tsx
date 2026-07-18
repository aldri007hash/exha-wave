"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  accountNumber: string | null;
  accountName: string | null;
  instructions: string | null;
  qrisImage: string | null;
  isActive: boolean;
}

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState("BANK_TRANSFER");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [qrisImage, setQrisImage] = useState("");
  const [isActive, setIsActive] = useState(true);

  const fetchMethods = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/payment-methods");
      if (!res.ok) throw new Error("Gagal memuat data");
      const data = await res.json();
      setMethods(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const resetForm = () => {
    setName("");
    setType("BANK_TRANSFER");
    setAccountNumber("");
    setAccountName("");
    setInstructions("");
    setQrisImage("");
    setIsActive(true);
    setEditing(null);
    setFormOpen(false);
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditing(method);
    setName(method.name);
    setType(method.type);
    setAccountNumber(method.accountNumber || "");
    setAccountName(method.accountName || "");
    setInstructions(method.instructions || "");
    setQrisImage(method.qrisImage || "");
    setIsActive(method.isActive);
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      type,
      accountNumber: accountNumber || null,
      accountName: accountName || null,
      instructions: instructions || null,
      qrisImage: qrisImage || null,
      isActive,
    };

    try {
      const url = editing
        ? `/api/admin/payment-methods/${editing.id}`
        : "/api/admin/payment-methods";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Gagal menyimpan");
      resetForm();
      fetchMethods();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus metode ini?")) return;
    try {
      const res = await fetch(`/api/admin/payment-methods/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus");
      fetchMethods();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Metode Pembayaran</h1>
        <button
          onClick={() => {
            resetForm();
            setFormOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} /> Tambah
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipe</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No Rek</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Atas Nama</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {methods.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3">{m.name}</td>
                  <td className="px-4 py-3">{m.type}</td>
                  <td className="px-4 py-3">{m.accountNumber || "-"}</td>
                  <td className="px-4 py-3">{m.accountName || "-"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        m.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {m.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      onClick={() => handleEdit(m)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editing ? "Edit" : "Tambah"} Metode</h2>
              <button onClick={resetForm}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Nama</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Tipe</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="BANK_TRANSFER">Transfer Bank</option>
                  <option value="QRIS">QRIS</option>
                  <option value="EWALLET">E-Wallet</option>
                  <option value="OTHER">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">No Rekening / ID</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Atas Nama</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Instruksi</label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">URL Gambar QRIS</label>
                <input
                  type="text"
                  value={qrisImage}
                  onChange={(e) => setQrisImage(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <label className="text-sm">Aktif</label>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border rounded"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}