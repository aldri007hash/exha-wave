"use client"
import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Send, ImageIcon, Lock } from "lucide-react"
import InfoBanner from "@/components/InfoBanner"

export default function GroupChatPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [messages, setMessages] = useState<any[]>([])
  const [enabled, setEnabled] = useState(true)
  const [newMessage, setNewMessage] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN"

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated" || (session?.user?.role !== "TALENT" && session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPER_ADMIN")) { router.push("/login"); return }
    fetchMessages()
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [status])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  const fetchMessages = async () => {
    const res = await fetch("/api/talent/group-chat")
    const data = await res.json()
    setMessages(data.messages || [])
    setEnabled(data.enabled)
    setLoading(false)
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() && !image) return
    setSending(true)
    const formData = new FormData()
    if (newMessage.trim()) formData.append("message", newMessage)
    if (image) formData.append("image", image)
    await fetch("/api/talent/group-chat", { method: "POST", body: formData })
    setNewMessage(""); setImage(null); fetchMessages(); setSending(false)
  }

  const isCurrentUser = (userId: string) => userId === (session?.user as any)?.id

  if (loading) return <div className="flex items-center justify-center h-64" style={{ color: "#6B1D40" }}>Memuat group chat...</div>

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-120px)] flex flex-col">
      <h1 className="text-2xl font-bold mb-4" style={{ color: "#4A0E2E" }}>Group Chat</h1>
      <InfoBanner id="talent-group-chat">
        💬 <strong>Group Chat</strong> adalah ruang obrolan bersama untuk semua talent dan admin. Kamu bisa kirim pesan teks. Hanya Superadmin yang bisa kirim gambar.
      </InfoBanner>
      {!enabled && (
        <div className="rounded-xl p-4 mb-4 text-center" style={{ backgroundColor: "#FFF3E0", border: "1px solid #E65100" }}>
          <Lock size={16} className="inline mr-2" style={{ color: "#E65100" }} /><span style={{ color: "#BF360C" }}>Group chat sedang dinonaktifkan oleh Superadmin.</span>
        </div>
      )}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 p-4 rounded-xl" style={{ backgroundColor: "#FAF7F2", border: "1px solid #D4B896" }}>
        {messages.length === 0 && <p className="text-center text-sm" style={{ color: "#6B1D40" }}>Belum ada pesan.</p>}
        {messages.map(msg => {
          const mine = isCurrentUser(msg.userId)
          return (
            <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] p-3 rounded-xl ${mine ? "rounded-br-md" : "rounded-bl-md"}`} style={{ backgroundColor: mine ? "#800020" : "#F5E6D3", color: mine ? "#F5E6D3" : "#4A0E2E", border: mine ? "none" : "1px solid #D4B896" }}>
                <p className="text-xs font-semibold mb-1" style={{ color: mine ? "#C9A96E" : "#800020" }}>{msg.user?.name} {msg.user?.role === "SUPER_ADMIN" ? "⭐" : ""}</p>
                {msg.message && <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>}
                {msg.imageUrl && <img src={msg.imageUrl} alt="Gambar" className="mt-2 rounded-lg max-w-full cursor-pointer" onClick={() => window.open(msg.imageUrl, "_blank")} />}
                <p className="text-[10px] mt-1 opacity-70">{new Date(msg.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            </div>
          )
        })}
        <div ref={chatEndRef} />
      </div>
      {enabled && (
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input type="file" accept="image/png,image/jpeg" onChange={e => setImage(e.target.files?.[0] || null)} className="hidden" id="group-chat-image" />
          {isSuperAdmin && <label htmlFor="group-chat-image" className="p-2 rounded-full cursor-pointer" style={{ backgroundColor: "#F5E6D3", color: "#800020" }} title="Kirim Gambar (Superadmin only)"><ImageIcon size={18} /></label>}
          <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Ketik pesan..." className="flex-1 border rounded-full px-4 py-2 text-sm" style={{ backgroundColor: "#FAF7F2", borderColor: "#D4B896", color: "#4A0E2E" }} />
          <button type="submit" disabled={sending} className="p-2 rounded-full" style={{ backgroundColor: "#800020", color: "#F5E6D3" }}><Send size={18} /></button>
        </form>
      )}
    </div>
  )
}
