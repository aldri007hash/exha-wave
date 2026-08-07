"use client"
import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Send, ImageIcon, Power, PowerOff } from "lucide-react"

export default function AdminGroupChatPage() {
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
    if (status === "unauthenticated" || (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPER_ADMIN")) {
      router.push("/login"); return
    }
    fetchMessages()
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [status])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const fetchMessages = async () => {
    const res = await fetch("/api/admin/group-chat")
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
    await fetch("/api/admin/group-chat", { method: "POST", body: formData })
    setNewMessage("")
    setImage(null)
    fetchMessages()
    setSending(false)
  }

  const handleToggle = async () => {
    const res = await fetch("/api/admin/toggle-group-chat", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !enabled }),
    })
    const data = await res.json()
    setEnabled(data.enabled)
  }

  const isCurrentUser = (userId: string) => userId === (session?.user as any)?.id

  if (loading) return <div className="text-center py-12">Memuat group chat...</div>

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-120px)] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Group Chat</h1>
        {isSuperAdmin && (
          <button
            onClick={handleToggle}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${enabled ? "bg-red-500 text-white" : "bg-green-500 text-white"}`}
          >
            {enabled ? <><PowerOff size={16} /> Nonaktifkan Chat</> : <><Power size={16} /> Aktifkan Chat</>}
          </button>
        )}
      </div>

      {!enabled && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-300 rounded-xl p-4 mb-4 text-center text-sm text-orange-700">
          Group chat sedang dinonaktifkan.
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 mb-4 p-4 bg-card border border-border rounded-xl">
        {messages.length === 0 && <p className="text-center text-sm text-gray-500">Belum ada pesan.</p>}
        {messages.map(msg => {
          const mine = isCurrentUser(msg.userId)
          return (
            <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] p-3 rounded-xl ${mine ? "bg-primary text-white rounded-br-md" : "bg-card border border-border rounded-bl-md"}`}>
                <p className="text-xs font-semibold mb-1 opacity-80">{msg.user?.name} {msg.user?.role === "SUPER_ADMIN" ? "⭐" : ""}</p>
                {msg.message && <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>}
                {msg.imageUrl && <img src={msg.imageUrl} alt="Gambar" className="mt-2 rounded-lg max-w-full cursor-pointer" onClick={() => window.open(msg.imageUrl, "_blank")} />}
                <p className="text-[10px] mt-1 opacity-60">{new Date(msg.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            </div>
          )
        })}
        <div ref={chatEndRef} />
      </div>

      {enabled && (
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input type="file" accept="image/png,image/jpeg" onChange={e => setImage(e.target.files?.[0] || null)} className="hidden" id="admin-group-chat-image" />
          {isSuperAdmin && (
            <label htmlFor="admin-group-chat-image" className="p-2 bg-card border border-border rounded-full cursor-pointer" title="Kirim Gambar">
              <ImageIcon size={18} />
            </label>
          )}
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Ketik pesan..."
            className="flex-1 border border-border rounded-full px-4 py-2 text-sm bg-transparent"
          />
          <button type="submit" disabled={sending} className="p-2 bg-primary text-white rounded-full">
            <Send size={18} />
          </button>
        </form>
      )}
    </div>
  )
}
