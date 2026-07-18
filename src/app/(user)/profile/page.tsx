"use client"
import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const [form, setForm] = useState({ name: "", email: "", phone: "" })
  const [image, setImage] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [canEdit, setCanEdit] = useState(true)
  const [error, setError] = useState("")
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (session?.user) {
      setForm({
        name: session.user.name || "",
        email: session.user.email || "",
        phone: session.user.phone || "",
      })
      setImage(session.user.image || null)
      fetch("/api/profile/check-edit")
        .then(res => res.json())
        .then(data => setCanEdit(data.canEdit))
    }
  }, [session])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran file maksimal 5MB")
      return
    }

    setUploading(true)
    setError("")

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    if (!cloudName) {
      setError("Cloudinary belum dikonfigurasi. Isi NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME di .env")
      setUploading(false)
      return
    }

    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", "exha_wave_preset")

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (data.secure_url) {
        setImage(data.secure_url)
        setError("")
      } else {
        setError("Gagal upload: " + (data.error?.message || "Preset 'exha_wave_preset' tidak ditemukan. Buat di Settings → Upload → Add upload preset."))
      }
    } catch {
      setError("Gagal upload, periksa koneksi internet.")
    }
    setUploading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canEdit && session?.user?.role !== "ADMIN") {
      setError("Anda hanya bisa mengedit profil 1x dalam 7 hari.")
      return
    }

    const payload = { name: form.name, email: form.email, phone: form.phone, image }

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        // PENTING: panggil update() agar session ter-refresh
        await update()
        setEditing(false)
        setError("")
      } else {
        const data = await res.json()
        setError(data.error || "Gagal menyimpan profil")
      }
    } catch {
      setError("Gagal menyimpan profil, periksa koneksi.")
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="font-heading text-3xl font-bold mb-6">Profile</h1>
      <div className="bg-card border border-border rounded-xl p-6">
        {!editing ? (
          <div className="space-y-3 text-center">
            <div className="flex justify-center mb-4">
              {image ? (
                <img src={image} className="w-24 h-24 rounded-full object-cover border-2 border-primary/20 shadow-lg" alt="Profile" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary">
                  {form.name?.[0] || "?"}
                </div>
              )}
            </div>
            <p><strong>Nama:</strong> {form.name}</p>
            <p><strong>Email:</strong> {form.email}</p>
            <p><strong>Telepon:</strong> {form.phone || "-"}</p>
            <button onClick={() => setEditing(true)} className="bg-primary text-white px-6 py-2 rounded-full mt-4">Edit Profile</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                {image ? (
                  <img src={image} className="w-24 h-24 rounded-full object-cover" alt="Preview" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-3xl">{form.name?.[0] || "?"}</div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 shadow-md hover:shadow-lg transition-all"
                  title="Upload Foto"
                >
                  📷
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/png, image/jpeg, image/jpg" onChange={handleImageUpload} className="hidden" />
              {uploading && <p className="text-xs text-muted-foreground animate-pulse">Mengupload...</p>}
              {image && !uploading && <p className="text-xs text-green-500">✅ Foto berhasil diupload, klik Simpan untuk menyimpan</p>}
            </div>

            <div>
              <label className="text-sm mb-1 block">Nama</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="border rounded-xl px-3 py-2.5 w-full bg-transparent" />
            </div>
            <div>
              <label className="text-sm mb-1 block">Email</label>
              <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="border rounded-xl px-3 py-2.5 w-full bg-transparent" />
            </div>
            <div>
              <label className="text-sm mb-1 block">Telepon</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="border rounded-xl px-3 py-2.5 w-full bg-transparent" />
            </div>

            <div className="flex gap-2 justify-end mt-2">
              <button type="button" onClick={() => setEditing(false)} className="border px-5 py-2 rounded-full">Batal</button>
              <button type="submit" className="bg-primary text-white px-5 py-2 rounded-full">Simpan</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}