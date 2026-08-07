"use client"
import { MessageCircle } from "lucide-react"

export default function WhatsAppFloating() {
  const phone = "6285799428700"
  const message = encodeURIComponent("Halo Exha Wave, saya ingin bertanya...")

  return (
    <a
      href={`https://wa.me/${phone}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-28 md:bottom-8 right-4 z-50 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 hover:scale-110 transition-all animate-pulse"
      title="Chat via WhatsApp"
    >
      <MessageCircle size={24} />
    </a>
  )
}
