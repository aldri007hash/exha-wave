"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface Setting {
  id: string;
  key: string;
  value: string;
}

const defaultSettings: Record<string, string> = {
  siteTitle: "Exha Wave",
  siteDescription: "Jasa social media marketing",
  logoUrl: "",
  pointValue: "0.1",
  minTopup: "15000",
  maxTopup: "1000000",
  batasAutoCancel: "24",
  supportContact: "08123456789",
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error("Gagal memuat pengaturan");
      const data = await res.json();
      setSettings(data);
      const current: Record<string, string> = {};
      data.forEach((s: Setting) => { current[s.key] = s.value; });
      setFormData(current);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) { alert("Hanya Superadmin yang bisa mengubah pengaturan."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      alert("Pengaturan berhasil disimpan");
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  };

  if (loading) return <p className="p-4">Memuat pengaturan...</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Pengaturan Website</h1>
      {!isSuperAdmin && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm text-yellow-700">
          Hanya Superadmin yang dapat mengubah pengaturan.
        </div>
      )}
      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 max-w-2xl space-y-4">
        <div>
          <label className="block text-sm mb-1">Judul Website</label>
          <input type="text" value={formData.siteTitle || defaultSettings.siteTitle} onChange={(e) => handleChange("siteTitle", e.target.value)} className="w-full border rounded px-3 py-2 bg-transparent" disabled={!isSuperAdmin} />
        </div>
        <div>
          <label className="block text-sm mb-1">Deskripsi</label>
          <textarea value={formData.siteDescription || defaultSettings.siteDescription} onChange={(e) => handleChange("siteDescription", e.target.value)} className="w-full border rounded px-3 py-2 bg-transparent" disabled={!isSuperAdmin} />
        </div>
        <div>
          <label className="block text-sm mb-1">URL Logo</label>
          <input type="text" value={formData.logoUrl || defaultSettings.logoUrl} onChange={(e) => handleChange("logoUrl", e.target.value)} className="w-full border rounded px-3 py-2 bg-transparent" disabled={!isSuperAdmin} />
        </div>
        <div>
          <label className="block text-sm mb-1">Nilai Poin (Rp per poin)</label>
          <input type="number" step="0.01" value={formData.pointValue || defaultSettings.pointValue} onChange={(e) => handleChange("pointValue", e.target.value)} className="w-full border rounded px-3 py-2 bg-transparent" disabled={!isSuperAdmin} />
          <p className="text-xs text-gray-500">100 poin = Rp {((parseFloat(formData.pointValue) || 0) * 100).toFixed(0)}</p>
        </div>
        <div>
          <label className="block text-sm mb-1">Minimal Topup (Rp)</label>
          <input type="number" value={formData.minTopup || defaultSettings.minTopup} onChange={(e) => handleChange("minTopup", e.target.value)} className="w-full border rounded px-3 py-2 bg-transparent" disabled={!isSuperAdmin} />
        </div>
        <div>
          <label className="block text-sm mb-1">Maksimal Topup (Rp)</label>
          <input type="number" value={formData.maxTopup || defaultSettings.maxTopup} onChange={(e) => handleChange("maxTopup", e.target.value)} className="w-full border rounded px-3 py-2 bg-transparent" disabled={!isSuperAdmin} />
        </div>
        <div>
          <label className="block text-sm mb-1">Batas Auto-Cancel (jam)</label>
          <input type="number" value={formData.batasAutoCancel || defaultSettings.batasAutoCancel} onChange={(e) => handleChange("batasAutoCancel", e.target.value)} className="w-full border rounded px-3 py-2 bg-transparent" disabled={!isSuperAdmin} />
          <p className="text-xs text-gray-500">Pesanan Pending yang melebihi batas ini akan otomatis dibatalkan.</p>
        </div>
        <div>
          <label className="block text-sm mb-1">Kontak Support</label>
          <input type="text" value={formData.supportContact || defaultSettings.supportContact} onChange={(e) => handleChange("supportContact", e.target.value)} className="w-full border rounded px-3 py-2 bg-transparent" disabled={!isSuperAdmin} />
        </div>
        {isSuperAdmin && (
          <div>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary/80 disabled:opacity-50">
              {saving ? "Menyimpan..." : "Simpan Pengaturan"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
