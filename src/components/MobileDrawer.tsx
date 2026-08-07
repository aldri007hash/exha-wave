"use client"
import { useEffect, useState, useRef } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import {
  X, Bell, Home, ShoppingBag, Info, HelpCircle, Star, Phone,
  MessageCircle, Wallet, LayoutDashboard, Package, User, LogOut, LogIn,
  FileText, BookOpen, Shield, Mail, Search, Mic
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Notification {
  id: string; title: string; message: string; isRead: boolean; createdAt: string;
}

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function MobileDrawer({ isOpen, onClose }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [showNotifPanel, setShowNotifPanel] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  const fetchNotifs = async () => {
    if (!session?.user) return
    try {
      const res = await fetch("/api/notifications")
      const data = await res.json()
      setNotifications(data.notifications || [])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (isOpen) fetchNotifs()
  }, [isOpen])

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PUT" })
    fetchNotifs()
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    onClose()
    setSearchQuery("")
  }

  const startVoice = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Browser tidak mendukung voice search")
      return
    }
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = "id-ID"
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      router.push(`/search?q=${encodeURIComponent(transcript)}`)
      onClose()
      setSearchQuery("")
    }
    recognition.onerror = () => setIsListening(false)
    recognition.start()
    recognitionRef.current = recognition
  }

  if (!mounted || !isOpen) return null

  const unreadCount = notifications.filter(n => !n.isRead).length
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN"

  const menuItemClass = "flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-primary/5 text-sm font-medium transition-colors"

  return createPortal(
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-[9998]"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-card border-l border-border shadow-2xl z-[9999] flex flex-col"
      >
        <div className="flex justify-between items-center p-5 border-b border-border">
          <span className="font-heading font-bold text-lg">Menu</span>
          <button onClick={onClose} className="p-2 hover:bg-card rounded-full"><X size={20} /></button>
        </div>

        {/* SEARCH BAR MOBILE */}
        <div className="px-4 py-3 border-b border-border">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Cari layanan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border border-border rounded-full px-3 py-2 text-sm bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button type="submit" className="p-2 bg-primary text-white rounded-full flex-shrink-0">
              <Search size={16} />
            </button>
            <button
              type="button"
              onClick={startVoice}
              className={`p-2 bg-background/50 rounded-full flex-shrink-0 ${isListening ? "text-red-500" : ""}`}
              title="Cari dengan suara"
            >
              <Mic size={16} />
            </button>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-0.5">
          <Link href="/#beranda" onClick={onClose} className={menuItemClass}><Home size={18} /> Beranda</Link>
          <Link href="/#layanan" onClick={onClose} className={menuItemClass}><ShoppingBag size={18} /> Layanan Kami</Link>
          <Link href="/#tentang" onClick={onClose} className={menuItemClass}><Info size={18} /> Tentang Kami</Link>
          <Link href="/#faq" onClick={onClose} className={menuItemClass}><HelpCircle size={18} /> FAQ</Link>
          <Link href="/blog" onClick={onClose} className={menuItemClass}><BookOpen size={18} /> Blog</Link>
          <Link href="/#testimoni" onClick={onClose} className={menuItemClass}><Star size={18} /> Testimoni</Link>
          <Link href="/#kontak" onClick={onClose} className={menuItemClass}><Phone size={18} /> Hubungi Kami</Link>
          
          <hr className="my-3 border-border" />
          
          {session?.user ? (
            <>
              <Link href="/chat" onClick={onClose} className={menuItemClass}><MessageCircle size={18} /> Live Chat</Link>
              <Link href="/topup" onClick={onClose} className={menuItemClass}><Wallet size={18} /> Topup Saldo</Link>
              {isAdmin && (
                <Link href="/admin" onClick={onClose} className={menuItemClass}><LayoutDashboard size={18} /> Dashboard Admin</Link>
              )}
              <Link href="/orders" onClick={onClose} className={menuItemClass}><Package size={18} /> My Orders</Link>
              <Link href="/profile" onClick={onClose} className={menuItemClass}><User size={18} /> Profile</Link>
              
              {/* Notifikasi */}
              <button
                onClick={() => setShowNotifPanel(true)}
                className={`${menuItemClass} w-full relative`}
              >
                <Bell size={18} /> Notifikasi
                {unreadCount > 0 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">{unreadCount}</span>
                )}
              </button>

              <hr className="my-3 border-border" />

              {/* Kontak & Legal (dipindahkan dari footer) */}
              <div className="text-xs text-muted-foreground px-3 py-2 space-y-2">
                <a href="mailto:exhagroup@gmail.com" className="flex items-center gap-2 hover:text-primary transition-colors">
                  <Mail size={14} /> exhagroup@gmail.com
                </a>
                <a href="https://wa.me/6285799428700" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors">
                  <Phone size={14} /> +62 857-9942-8700
                </a>
              </div>

              <div className="flex flex-wrap gap-x-3 gap-y-1 px-3 pt-2 text-xs text-muted-foreground">
                <Link href="/syarat-dan-ketentuan" onClick={onClose} className="hover:text-primary transition-colors">Syarat & Ketentuan</Link>
                <span className="text-gray-500">•</span>
                <Link href="/kebijakan-privasi" onClick={onClose} className="hover:text-primary transition-colors">Kebijakan Privasi</Link>
                <span className="text-gray-500">•</span>
                <Link href="/dokumentasi-api" onClick={onClose} className="hover:text-primary transition-colors">Dokumentasi API</Link>
                <span className="text-gray-500">•</span>
                <Link href="/cara-refund" onClick={onClose} className="hover:text-primary transition-colors">Refund</Link>
                <span className="text-gray-500">/</span>
                <Link href="/cara-komplain" onClick={onClose} className="hover:text-primary transition-colors">Komplain</Link>
              </div>

              <button onClick={() => { signOut(); onClose() }} className={`${menuItemClass} hover:bg-red-500/10 hover:text-red-500 w-full mt-3`}>
                <LogOut size={18} /> Logout
              </button>
            </>
          ) : (
            <Link href="/login" onClick={onClose} className={`${menuItemClass} bg-primary text-white justify-center hover:bg-primary/90`}>
              <LogIn size={18} /> Masuk / Daftar
            </Link>
          )}
        </div>
      </motion.div>

      {/* Panel Notifikasi Slide‑Up */}
      <AnimatePresence>
        {showNotifPanel && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-[10000] max-h-[75vh] bg-card border-t border-border rounded-t-3xl shadow-2xl flex flex-col"
          >
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h3 className="font-heading font-semibold text-lg">Notifikasi</h3>
              <div className="flex gap-2">
                <button onClick={markAllRead} className="text-xs text-primary font-medium px-3 py-1 rounded-full hover:bg-primary/10">Tandai Semua Dibaca</button>
                <button onClick={() => setShowNotifPanel(false)} className="p-1 hover:bg-card rounded-full"><X size={20} /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Belum ada notifikasi.</p>
              ) : (
                notifications.slice(0, 20).map(notif => (
                  <div key={notif.id} className={`p-3 rounded-xl text-sm ${notif.isRead ? "bg-card" : "bg-primary/5 border-l-4 border-primary"}`}>
                    <p className="font-medium">{notif.title}</p>
                    <p className="text-muted-foreground text-xs mt-1">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-2">{new Date(notif.createdAt).toLocaleString("id-ID")}</p>
                    {notif.isRead && <p className="text-xs text-green-500 mt-1">✔ Sudah dibaca</p>}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body
  )
}
