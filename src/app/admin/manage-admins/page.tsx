"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Plus, Key, Ban, Lock, LogOut } from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  banReason?: string;
  createdAt: string;
}

export default function ManageAdminsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [banUserId, setBanUserId] = useState<string | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banSubmitting, setBanSubmitting] = useState(false);

  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const [showOwnPassword, setShowOwnPassword] = useState(false);
  const [ownPassword, setOwnPassword] = useState("");
  const [ownPasswordSubmitting, setOwnPasswordSubmitting] = useState(false);

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  useEffect(() => {
    if (status === "loading") return;
    if (!isSuperAdmin) { router.push("/admin"); return; }
    fetchAdmins();
  }, [status, isSuperAdmin]);

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/admin/manage-admins");
      if (!res.ok) throw new Error("Gagal memuat data admin");
      const data = await res.json();
      setAdmins(data);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/manage-admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, email: newEmail, password: newPassword }),
      });
      if (!res.ok) { const errData = await res.json(); throw new Error(errData.error || "Gagal menambah admin"); }
      setNewName(""); setNewEmail(""); setNewPassword(""); setShowForm(false);
      fetchAdmins();
    } catch (err: any) { alert(err.message); } finally { setSubmitting(false); }
  };

  const handleBan = async () => {
    if (!banUserId || !banReason.trim()) return;
    setBanSubmitting(true);
    try {
      const res = await fetch(`/api/admin/manage-admins/${banUserId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ban", reason: banReason }),
      });
      if (!res.ok) throw new Error("Gagal menonaktifkan");
      setBanUserId(null); setBanReason(""); fetchAdmins();
    } catch (err: any) { alert(err.message); } finally { setBanSubmitting(false); }
  };

  const handleResetPassword = async () => {
    if (!resetUserId || !resetPassword.trim()) return;
    setResetSubmitting(true);
    try {
      const res = await fetch(`/api/admin/manage-admins/${resetUserId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset-password", password: resetPassword }),
      });
      if (!res.ok) throw new Error("Gagal mereset password");
      alert("Password berhasil direset");
      setResetUserId(null); setResetPassword("");
    } catch (err: any) { alert(err.message); } finally { setResetSubmitting(false); }
  };

  const handleForceLogout = async (adminId: string) => {
    if (!confirm("Force logout admin ini? Admin akan otomatis logout dalam 30 detik.")) return;
    try {
      const res = await fetch("/api/admin/force-logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId }),
      });
      if (!res.ok) throw new Error("Gagal force logout");
      alert("Admin akan logout dalam 30 detik.");
    } catch (err: any) { alert(err.message); }
  };

  const handleOwnPasswordChange = async () => {
    if (!ownPassword.trim()) return;
    setOwnPasswordSubmitting(true);
    try {
      const res = await fetch("/api/admin/manage-admins/change-own-password", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: ownPassword }),
      });
      if (!res.ok) throw new Error("Gagal mengubah password");
      alert("Password berhasil diubah");
      setShowOwnPassword(false); setOwnPassword("");
    } catch (err: any) { alert(err.message); } finally { setOwnPasswordSubmitting(false); }
  };

  if (status === "loading" || loading) return <p className="p-4">Memuat...</p>;
  if (!isSuperAdmin) return null;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Kelola Admin</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowOwnPassword(true)} className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50">
            <Lock size={18} /> Ganti Password Saya
          </button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Plus size={18} /> Tambah Admin
          </button>
        </div>
      </div>

      {showOwnPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-heading font-semibold mb-4">Ganti Password Superadmin</h3>
            <input type="password" placeholder="Password baru" value={ownPassword} onChange={(e) => setOwnPassword(e.target.value)} className="border rounded px-3 py-2 w-full mb-4" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowOwnPassword(false)} className="border px-4 py-2 rounded">Batal</button>
              <button onClick={handleOwnPasswordChange} disabled={ownPasswordSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">{ownPasswordSubmitting ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <form onSubmit={handleAddAdmin} className="space-y-4 max-w-md">
            <div><label className="block text-sm font-medium">Nama</label><input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full border rounded px-3 py-2" required /></div>
            <div><label className="block text-sm font-medium">Email</label><input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full border rounded px-3 py-2" required /></div>
            <div><label className="block text-sm font-medium">Password</label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border rounded px-3 py-2" required /></div>
            <div className="flex gap-2">
              <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">{submitting ? "Menyimpan..." : "Simpan"}</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded">Batal</button>
            </div>
          </form>
        </div>
      )}

      {banUserId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-heading font-semibold mb-4">Nonaktifkan Admin</h3>
            <textarea placeholder="Alasan nonaktifkan..." value={banReason} onChange={(e) => setBanReason(e.target.value)} className="border rounded px-3 py-2 w-full mb-4" rows={3} />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setBanUserId(null)} className="border px-4 py-2 rounded">Batal</button>
              <button onClick={handleBan} disabled={banSubmitting} className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50">{banSubmitting ? "Menonaktifkan..." : "Nonaktifkan"}</button>
            </div>
          </div>
        </div>
      )}

      {resetUserId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-heading font-semibold mb-4">Reset Password Admin</h3>
            <input type="password" placeholder="Password baru" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} className="border rounded px-3 py-2 w-full mb-4" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setResetUserId(null)} className="border px-4 py-2 rounded">Batal</button>
              <button onClick={handleResetPassword} disabled={resetSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">{resetSubmitting ? "Menyimpan..." : "Reset"}</button>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dibuat</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {admins.map((admin) => (
              <tr key={admin.id}>
                <td className="px-4 py-3">{admin.name}</td>
                <td className="px-4 py-3">{admin.email}</td>
                <td className="px-4 py-3">{admin.role}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${admin.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{admin.status}</span>
                  {admin.banReason && <p className="text-xs text-gray-500 mt-1">{admin.banReason}</p>}
                </td>
                <td className="px-4 py-3">{new Date(admin.createdAt).toLocaleDateString("id-ID")}</td>
                <td className="px-4 py-3">
                  {admin.role !== "SUPER_ADMIN" ? (
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => { setResetUserId(admin.id); setResetPassword("") }} className="text-blue-600 hover:text-blue-800" title="Reset Password"><Key size={16} /></button>
                      <button onClick={() => { setBanUserId(admin.id); setBanReason("") }} className="text-red-600 hover:text-red-800" title="Nonaktifkan"><Ban size={16} /></button>
                      <button onClick={() => handleForceLogout(admin.id)} className="text-orange-600 hover:text-orange-800" title="Force Logout"><LogOut size={16} /></button>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">Super Admin</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
