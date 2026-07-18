"use client"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { X } from "lucide-react"

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function MobileDrawer({ isOpen, onClose }: Props) {
  const { data: session } = useSession()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted || !isOpen) return null

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-background border-l border-border shadow-2xl z-[9999] flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-border">
          <span className="font-heading font-bold text-lg">Menu</span>
          <button onClick={onClose} className="p-2 hover:bg-card rounded-full">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-1">
          <Link href="/#beranda" onClick={onClose} className="flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-primary/5">
            <span className="text-xl">🏠</span> Beranda
          </Link>
          <Link href="/#layanan" onClick={onClose} className="flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-primary/5">
            <span className="text-xl">🛒</span> Layanan Kami
          </Link>
          <Link href="/#tentang" onClick={onClose} className="flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-primary/5">
            <span className="text-xl">ℹ️</span> Tentang Kami
          </Link>
          <Link href="/#faq" onClick={onClose} className="flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-primary/5">
            <span className="text-xl">❓</span> FAQ
          </Link>
          <Link href="/#testimoni" onClick={onClose} className="flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-primary/5">
            <span className="text-xl">⭐</span> Testimoni
          </Link>
          <Link href="/#kontak" onClick={onClose} className="flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-primary/5">
            <span className="text-xl">📞</span> Hubungi Kami
          </Link>
          <hr className="my-3 border-border" />
          {session?.user ? (
            <>
              <Link href="/chat" onClick={onClose} className="flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-primary/5">
                <span className="text-xl">💬</span> Live Chat
              </Link>
              <Link href="/topup" onClick={onClose} className="flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-primary/5">
                <span className="text-xl">💰</span> Topup Saldo
              </Link>
              {session.user.role === "ADMIN" && (
                <Link href="/admin" onClick={onClose} className="flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-primary/5">
                  <span className="text-xl">⚙️</span> Dashboard Admin
                </Link>
              )}
              <Link href="/orders" onClick={onClose} className="flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-primary/5">
                <span className="text-xl">📦</span> My Orders
              </Link>
              <Link href="/profile" onClick={onClose} className="flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-primary/5">
                <span className="text-xl">👤</span> Profile
              </Link>
              <button onClick={() => { signOut(); onClose() }} className="flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-red-500/10 hover:text-red-500 text-sm font-medium w-full text-left">
                <span className="text-xl">🚪</span> Logout
              </button>
            </>
          ) : (
            <Link href="/login" onClick={onClose} className="flex items-center gap-3 py-3 px-3 rounded-xl bg-primary text-white text-sm font-medium">
              <span className="text-xl">🔑</span> Masuk / Daftar
            </Link>
          )}
        </div>
      </div>
    </>,
    document.body
  )
}