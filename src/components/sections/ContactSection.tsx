"use client"
import { useState } from "react"
import { FaWhatsapp, FaEnvelope, FaMapMarkerAlt, FaTiktok, FaFacebook, FaTwitter, FaInstagram } from "react-icons/fa"

export default function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" })
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) setSent(true)
  }

  return (
    <section id="kontak" className="py-16">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="font-heading text-3xl font-bold mb-2 text-center" data-aos="fade-up">
          Hubungi Kami
        </h2>
        <p className="text-center text-gray-500 mb-8" data-aos="fade-up" data-aos-delay="100">
          Konsultasi & Estimasi Harga. Isi form di bawah dan tim kami akan merespons dalam 10 menit.
        </p>
        <div className="flex justify-center flex-wrap gap-4 mb-8">
          <a href="https://api.whatsapp.com/send/?phone=6285799428700&text&type=phone_number&app_absent=0" target="_blank" className="text-green-500 hover:scale-110 transition"><FaWhatsapp size={32} /></a>
          <a href="mailto:exhagroup@gmail.com" className="text-red-500 hover:scale-110 transition"><FaEnvelope size={32} /></a>
          <a href="https://www.google.com/maps?q=Kabupaten+Sleman,+Daerah+Istimewa+Yogyakarta" target="_blank" className="text-blue-500 hover:scale-110 transition"><FaMapMarkerAlt size={32} /></a>
          <a href="https://www.tiktok.com/@exha_buzz" target="_blank" className="text-black hover:scale-110 transition"><FaTiktok size={32} /></a>
          <a href="https://web.facebook.com/people/Exha-Buzz/61558533203850/" target="_blank" className="text-blue-700 hover:scale-110 transition"><FaFacebook size={32} /></a>
          <a href="https://x.com/JasaBuzzerExha" target="_blank" className="text-blue-400 hover:scale-110 transition"><FaTwitter size={32} /></a>
          <a href="https://instagram.com/jasabuzzerexha" target="_blank" className="text-pink-500 hover:scale-110 transition"><FaInstagram size={32} /></a>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-heading text-xl font-semibold mb-4">Kirim Pesan</h3>
          {sent ? (
            <p className="text-green-500 text-center">Pesan berhasil dikirim! Kami akan menghubungi Anda segera.</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input required placeholder="Nama / Username" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="border rounded px-3 py-2 bg-transparent" />
              <input required type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="border rounded px-3 py-2 bg-transparent" />
              <input required placeholder="Nomor Telepon" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="border rounded px-3 py-2 bg-transparent" />
              <textarea required placeholder="Catatan / Pesan" rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className="border rounded px-3 py-2 bg-transparent" />
              <button type="submit" className="bg-primary text-white py-2 rounded-full">Kirim Pesan</button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}