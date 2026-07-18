"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function EditAboutForm({ about }: { about: { id: string; content: string } | null }) {
  const [content, setContent] = useState(about?.content || "")
  const router = useRouter()

  const handleSave = async () => {
    await fetch("/api/admin/about", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    })
    router.refresh()
  }

  return (
    <div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={15}
        className="w-full border rounded p-2 font-mono text-sm"
        placeholder="HTML konten..."
      />
      <button onClick={handleSave} className="mt-2 bg-primary text-white px-4 py-2 rounded">Simpan</button>
    </div>
  )
}