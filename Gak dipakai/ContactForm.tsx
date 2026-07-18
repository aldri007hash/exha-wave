"use client"

import { useState } from "react"

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" })
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Kirim ke API send email
    await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setSent(true)
  }

  return (
    <div>
      {sent ? (
        <p className="text-green-600">Pesan berhasil dikirim. Terima kasih!</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="name" placeholder="Nama" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full border rounded px-3 py-2" />
          <input type="email" name="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required className="w-full border rounded px-3 py-2" />
          <input name="phone" placeholder="Nomor Telepon" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required className="w-full border rounded px-3 py-2" />
          <textarea name="message" placeholder="Pesan" rows={4} value={form.message} onChange={e => setForm({...form, message: e.target.value})} required className="w-full border rounded px-3 py-2" />
          <button type="submit" className="bg-primary text-white px-6 py-2 rounded-full">Kirim</button>
        </form>
      )}
    </div>
  )
}