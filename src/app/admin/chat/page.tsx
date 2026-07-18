"use client"
import { useState, useRef } from "react"
import useSWR from "swr"
import { Search, ImageIcon, Mic, Send, User as UserIcon, Bot } from "lucide-react"

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function AdminChatPage() {
  const { data, mutate } = useSWR("/api/admin/chat", fetcher, { refreshInterval: 5000 })
  const rooms = data?.rooms || []
  const searchUsers = data?.searchUsers || []

  const [selectedRoom, setSelectedRoom] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [uploading, setUploading] = useState(false)
  const [recording, setRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const imageInputRef = useRef<HTMLInputElement>(null)

  const uploadLocal = async (file: File, folder: string): Promise<string | null> => {
    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", folder)
    try {
      const res = await fetch("/api/upload/chat", { method: "POST", body: formData })
      const data = await res.json()
      return data.url || null
    } catch (err) {
      alert("Upload gagal")
      return null
    } finally {
      setUploading(false)
    }
  }

  const sendMessage = async (payload: { content?: string; imageUrl?: string; audioUrl?: string }) => {
    if (!selectedRoom) return
    const res = await fetch("/api/admin/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: selectedRoom.id, ...payload }),
    })
    if (res.ok) {
      mutate()
      setNewMessage("")
    }
  }

  const handleSendImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await uploadLocal(file, "images")
    if (url) await sendMessage({ imageUrl: url })
    if (imageInputRef.current) imageInputRef.current.value = ""
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        const url = await uploadLocal(blob, "audio")
        if (url) await sendMessage({ audioUrl: url })
        stream.getTracks().forEach(t => t.stop())
      }
      mediaRecorder.start()
      setRecording(true)
    } catch (err) {
      alert("Mikrofon tidak diizinkan")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
    }
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <h2 className="font-heading text-2xl font-bold mb-4">Panel Chat Admin</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 overflow-hidden">
        <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-4 flex flex-col overflow-hidden shadow-lg">
          <div className="flex gap-2 mb-4">
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === "Enter" && mutate(`/api/admin/chat?search=${encodeURIComponent(searchTerm)}`)} placeholder="Cari user..." className="border border-border rounded-xl px-3 py-2 flex-1 bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <button onClick={() => mutate(`/api/admin/chat?search=${encodeURIComponent(searchTerm)}`)} className="bg-primary text-white px-3 py-2 rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all"><Search size={16} /></button>
          </div>
          {searchUsers.length > 0 && (
            <div className="mb-4 space-y-1">
              {searchUsers.map((u: any) => (
                <button key={u.id} onClick={async () => { await fetch("/api/admin/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: u.id, content: "Halo, ada yang bisa kami bantu?" }) }); mutate() }} className="w-full text-left p-2.5 hover:bg-primary/10 rounded-xl text-sm transition-all">
                  <span className="font-medium">{u.name}</span>
                  <span className="text-xs text-muted-foreground ml-1">({u.email})</span>
                </button>
              ))}
            </div>
          )}
          <div className="flex-1 overflow-y-auto space-y-1">
            {rooms.map((room: any) => (
              <button key={room.id} onClick={() => setSelectedRoom(room)} className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${selectedRoom?.id === room.id ? "bg-primary/15 font-semibold border border-primary/30" : "hover:bg-card border border-transparent"}`}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">{room.user.name[0]}</div>
                  <span>{room.user.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4 flex flex-col overflow-hidden shadow-inner">
          {selectedRoom ? (
            <>
              <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-xl p-3 mb-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">{selectedRoom.user.name[0]}</div>
                <div>
                  <p className="font-semibold text-sm">{selectedRoom.user.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedRoom.user.email}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                {selectedRoom.messages.map((msg: any) => (
                  <div key={msg.id} className={`flex ${msg.role === "admin" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] p-3 rounded-2xl shadow-md ${msg.role === "admin" ? "bg-primary text-white rounded-br-md" : msg.role === "ai" ? "bg-card/90 backdrop-blur-md border border-border/50 rounded-bl-md" : "bg-card/90 backdrop-blur-md border border-border/50 rounded-bl-md"}`}>
                      {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                      {msg.imageUrl && <img src={msg.imageUrl} alt="gambar" className="max-w-full rounded-lg mt-2 cursor-pointer hover:scale-105 transition-transform" onClick={() => window.open(msg.imageUrl, "_blank")} />}
                      {msg.audioUrl && <audio controls src={msg.audioUrl} className="mt-2 w-full max-w-[200px] h-8" />}
                      <p className="text-[10px] mt-1 opacity-70 flex justify-between items-center">
                        <span className="flex items-center gap-1">
                          {msg.role === "user" ? <><UserIcon size={10} /> User</> : msg.role === "ai" ? <><Bot size={10} /> AI</> : <><UserIcon size={10} /> Admin</>}
                        </span>
                        <span>{formatTime(msg.createdAt)}</span>
                      </p>
                    </div>
                  </div>
                ))}
                {uploading && <p className="text-sm text-muted-foreground text-right">Mengupload...</p>}
              </div>
              <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-3 flex items-center gap-2 shadow-lg">
                <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Ketik balasan..." className="flex-1 bg-transparent resize-none text-sm px-3 py-2 focus:outline-none max-h-24" rows={1} />
                <input type="file" accept="image/*" ref={imageInputRef} onChange={handleSendImage} className="hidden" />
                <button onClick={() => imageInputRef.current?.click()} className="p-2 bg-background/50 rounded-xl hover:bg-primary/10 transition-all" title="Kirim Gambar"><ImageIcon size={16} /></button>
                <button onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording} className={`p-2 bg-background/50 rounded-xl hover:bg-primary/10 transition-all ${recording ? "bg-red-500 text-white" : ""}`} title="Tahan untuk merekam"><Mic size={16} /></button>
                <button onClick={() => sendMessage({ content: newMessage })} className="bg-primary text-white p-2.5 rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-1"><Send size={14} /> Kirim</button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-center">Pilih percakapan atau cari user untuk memulai.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}