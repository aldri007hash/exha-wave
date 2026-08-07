"use client"
import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [form, setForm] = useState({ name: "", email: "", phone: "" })
  const [image, setImage] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [canEdit, setCanEdit] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (session?.user) {
      setForm({
        name: session.user.name || "",
        email: session.user.email || "",
        phone: (session.user as any).phone || "",
      })
      setImage(session.user.image || null)
      if (session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN") {
        setCanEdit(true)
      } else {
        fetch("/api/profile")
          .then(res => res.json())
          .then(data => {
            if (data.lastProfileEdit) {
              const lastEdit = new Date(data.lastProfileEdit).getTime()
              const now = Date.now()
              const sevenDays = 7 * 24 * 60 * 60 * 1000
              setCanEdit(now - lastEdit >= sevenDays)
            } else {
              setCanEdit(true)
            }
          })
      }
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
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "profiles")
      const res = await fetch("/api/upload/chat", { method: "POST", body: formData })
      const data = await res.json()
      if (data.url) {
        setImage(data.url)
      } else {
        setError("Gagal upload")
      }
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
      } else {
        setError("Gagal upload: " + (data.error?.message || "Preset tidak ditemukan"))
      }
    } catch {
      setError("Gagal upload, periksa koneksi internet.")
    }
    setUploading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canEdit && session?.user?.role === "USER") {
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
        const data = await res.json()
        // Update session dengan data baru
        await update({
          ...session,
          user: {
            ...session?.user,
            name: data.user.name,
            email: data.user.email,
            phone: data.user.phone,
            image: data.user.image,
          },
        })
        setSuccess("Profil berhasil disimpan!")
        setEditing(false)
        setError("")
        if (session?.user?.role === "USER") setCanEdit(false)
        setTimeout(() => setSuccess(""), 3000)
        router.refresh() // Paksa refresh halaman untuk menampilkan data terbaru
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
            {!canEdit && session?.user?.role === "USER" && (
              <p className="text-sm text-yellow-500">Anda hanya bisa edit profil 1x dalam 7 hari.</p>
            )}
            {canEdit && (
              <button onClick={() => setEditing(true)} className="bg-primary text-white px-6 py-2 rounded-full mt-4">
                Edit Profile
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-600 p-3 rounded-xl text-sm">{error}</div>}
            {success && <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 text-green-600 p-3 rounded-xl text-sm">{success}</div>}

            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                {image ? (
                  <img src={image} className="w-24 h-24 rounded-full object-cover" alt="Preview" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-3xl">{form.name?.[0] || "?"}</div>
                )}
                <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 shadow-md">
                  📷
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/png, image/jpeg, image/jpg" onChange={handleImageUpload} className="hidden" />
              {uploading && <p className="text-xs">Mengupload...</p>}
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
