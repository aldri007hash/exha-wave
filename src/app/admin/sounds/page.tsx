"use client";
import { useState, useEffect } from "react";
import { Upload, Play, Trash2 } from "lucide-react";

interface Sound {
  id: string;
  category: string;
  label: string;
  fileUrl: string;
}

const categories = [
  { value: "pesanan_baru", label: "Pesanan Baru" },
  { value: "perubahan_status", label: "Perubahan Status Order" },
  { value: "pesan_chat", label: "Pesan Chat Masuk" },
  { value: "topup_saldo", label: "Top up Saldo" }, // <-- TAMBAH KATEGORI BARU
];

export default function AdminSoundsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("pesanan_baru");
  const [label, setLabel] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSounds = async () => {
    try {
      const res = await fetch("/api/admin/sounds");
      if (!res.ok) throw new Error("Gagal memuat data");
      const data = await res.json();
      setSounds(data.sounds || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSounds();
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);
    formData.append(
      "label",
      label || categories.find((c) => c.value === category)?.label || ""
    );
    const res = await fetch("/api/admin/sounds", {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      fetchSounds();
      setFile(null);
      setLabel("");
    }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus suara ini?")) return;
    await fetch(`/api/admin/sounds?id=${id}`, { method: "DELETE" });
    fetchSounds();
  };

  if (loading)
    return <p className="text-center py-12">Memuat daftar suara...</p>;

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold mb-2">
        Notifikasi Suara
      </h2>
      <p className="text-gray-500 mb-6">
        Upload suara untuk notifikasi. Suara akan otomatis diputar di browser
        saat ada event yang sesuai (pesanan baru, perubahan status, chat masuk,
        top up saldo). Admin akan mendengar semua notifikasi, user hanya
        mendengar notifikasi yang berkaitan dengan dirinya.
      </p>

      {/* Form Upload */}
      <div className="bg-card border border-border rounded-xl p-6 max-w-2xl mb-8">
        <h3 className="font-semibold mb-4">Upload Sound Baru</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Kategori Suara</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border rounded px-3 py-2 w-full bg-transparent"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Nama / Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={
                categories.find((c) => c.value === category)?.label
              }
              className="border rounded px-3 py-2 w-full bg-transparent"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">File Audio (MP3/WAV)</label>
            <input
              type="file"
              accept=".mp3,.wav"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mb-3"
            />
          </div>
          <div className="md:col-span-2">
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="bg-primary text-white px-4 py-2 rounded-full disabled:opacity-50 flex items-center gap-2"
            >
              <Upload size={16} /> {uploading ? "Mengupload..." : "Upload"}
            </button>
          </div>
        </div>
      </div>

      {/* Daftar Suara */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold mb-4">Daftar Suara ({sounds.length})</h3>
        {sounds.length === 0 && (
          <p className="text-sm text-gray-500">Belum ada suara.</p>
        )}
        {categories.map((cat) => {
          const catSounds = sounds.filter((s) => s.category === cat.value);
          if (catSounds.length === 0) return null;
          return (
            <div key={cat.value} className="mb-4">
              <h4 className="text-sm font-medium text-gray-400 mb-2">
                {cat.label}
              </h4>
              {catSounds.map((sound) => (
                <div
                  key={sound.id}
                  className="flex justify-between items-center p-2 hover:bg-primary/5 rounded"
                >
                  <div>
                    <p className="text-sm">{sound.label}</p>
                    <p className="text-xs text-gray-500">
                      {sound.fileUrl.split("/").pop()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => new Audio(sound.fileUrl).play()}
                      className="text-primary"
                      title="Putar"
                    >
                      <Play size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(sound.id)}
                      className="text-red-500"
                      title="Hapus"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}