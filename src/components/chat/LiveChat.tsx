"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

export default function LiveChat() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Fetch messages
  const fetchMessages = async () => {
    if (!session) return
    const res = await fetch("/api/chat")
    if (res.ok) {
      const data = await res.json()
      setMessages(data.messages)
    }
  }

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 10000) // polling 10 detik
    return () => clearInterval(interval)
  }, [session])

  const sendMessage = async () => {
    if (!input.trim()) return
    setLoading(true)
    setInput("")
    // Optimistic update: tambah pesan user
    setMessages(prev => [...prev, { role: "user", content: input }])
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input }),
    })
    if (res.ok) {
      const data = await res.json()
      setMessages(prev => [...prev, { role: "ai", content: data.reply }])
    }
    setLoading(false)
  }

  if (!session) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button onClick={() => setIsOpen(true)} className="bg-primary text-white rounded-full p-3 shadow-lg">
          <span className="text-lg">💬</span>
        </button>
      ) : (
        <div className="bg-card border border-border rounded-xl w-80 h-96 flex flex-col shadow-2xl">
          <div className="p-3 border-b flex justify-between items-center">
            <span className="font-semibold">Exha AI</span>
            <button onClick={() => setIsOpen(false)}>✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-2 rounded-lg text-sm ${msg.role === "user" ? "bg-primary text-white" : "bg-gray-200 text-gray-800"}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && <div className="text-center text-xs text-gray-500">Mengetik...</div>}
          </div>
          <div className="p-2 border-t flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="flex-1 border rounded px-2 py-1 text-sm"
              placeholder="Ketik pesan..."
            />
            <button onClick={sendMessage} className="bg-primary text-white px-3 rounded text-sm">Kirim</button>
          </div>
        </div>
      )}
    </div>
  )
}