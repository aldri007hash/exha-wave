"use client";

import { useEffect, useState } from "react";

interface Setting {
  id: string;
  key: string;
  value: string;
}

const defaultSettings: Record<string, string> = {
  siteTitle: "Exha Wave",
  siteDescription: "Jasa social media marketing",
  logoUrl: "",
  pointValue: "0.1", // 1 poin = Rp 0.1
  minTopup: "15000",
  maxTopup: "1000000",
  supportContact: "08123456789",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error("Gagal memuat pengaturan");
      const data = await res.json();
      setSettings(data);
      // Isi form dengan nilai dari DB atau default
      const current: Record<string, string> = {};
      data.forEach((s: Setting) => {
        current[s.key] = s.value;
      });
      setFormData(current);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      alert("Pengaturan berhasil disimpan");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-4">Memuat pengaturan...</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Pengaturan Website</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-2xl space-y-4">
        <div>
          <label className="block text-sm font-medium">Judul Website</label>
          <input
            type="text"
            value={formData.siteTitle || defaultSettings.siteTitle}
            onChange={(e) => handleChange("siteTitle", e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Deskripsi</label>
          <textarea
            value={formData.siteDescription || defaultSettings.siteDescription}
            onChange={(e) => handleChange("siteDescription", e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">URL Logo</label>
          <input
            type="text"
            value={formData.logoUrl || defaultSettings.logoUrl}
            onChange={(e) => handleChange("logoUrl", e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Nilai Poin (Rp per poin)</label>
          <input
            type="number"
            step="0.01"
            value={formData.pointValue || defaultSettings.pointValue}
            onChange={(e) => handleChange("pointValue", e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
          <p className="text-xs text-gray-500">100 poin = Rp {((parseFloat(formData.pointValue) || 0) * 100).toFixed(0)}</p>
        </div>
        <div>
          <label className="block text-sm font-medium">Minimal Topup (Rp)</label>
          <input
            type="number"
            value={formData.minTopup || defaultSettings.minTopup}
            onChange={(e) => handleChange("minTopup", e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Maksimal Topup (Rp)</label>
          <input
            type="number"
            value={formData.maxTopup || defaultSettings.maxTopup}
            onChange={(e) => handleChange("maxTopup", e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Kontak Support</label>
          <input
            type="text"
            value={formData.supportContact || defaultSettings.supportContact}
            onChange={(e) => handleChange("supportContact", e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan Pengaturan"}
          </button>
        </div>
      </form>
    </div>
  );
}