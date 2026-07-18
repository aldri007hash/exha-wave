"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AddPlatformForm() {
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch("/api/admin/platforms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug }),
    })
    setName("")
    setSlug("")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end mb-4">
      <div>
        <label className="block text-sm">Nama Platform</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="border rounded px-2 py-1" required />
      </div>
      <div>
        <label className="block text-sm">Slug (unix)</label>
        <input value={slug} onChange={(e) => setSlug(e.target.value)} className="border rounded px-2 py-1" required />
      </div>
      <button type="submit" className="bg-primary text-white px-4 py-1 rounded">Tambah Platform</button>
    </form>
  )
}