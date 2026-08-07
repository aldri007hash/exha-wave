"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"

export default function WelcomeBonus() {
  const [show, setShow] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  useEffect(() => {
    fetch("/api/bonus/claim")
      .then(res => res.json())
      .then(data => {
        if (!data.bonusClaimed) setShow(true)
      })
  }, [])

  const handleClaim = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/bonus/claim", { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        setClaimed(true)
        setMessage(data.message)
      } else {
        setMessage(data.error || "Gagal mengklaim bonus")
      }
    } catch {
      setMessage("Terjadi kesalahan")
    }
    setLoading(false)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-heading text-xl font-bold">🎉 Selamat Datang di Exha Wave!</h3>
          <button onClick={() => setShow(false)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
            <X size={18} />
          </button>
        </div>
        {claimed ? (
          <div className="text-center">
            <p className="text-green-500 font-semibold text-lg mb-2">{message}</p>
            <button onClick={() => setShow(false)} className="bg-primary text-white px-6 py-2 rounded-full mt-4">
              OK
            </button>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Yo! Akun kamu sudah aktif. Sebagai bonus, <strong>Rp5.000</strong> saldo Exha sudah menanti. Gas order sekarang!
            </p>
            <button
              onClick={handleClaim}
              disabled={loading}
              className="w-full bg-primary text-white py-2.5 rounded-full font-semibold disabled:opacity-50 mb-3"
            >
              {loading ? "Mengklaim..." : "Klaim Bonus"}
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => { setShow(false); router.push("/topup") }}
                className="flex-1 bg-green-500 text-white py-2 rounded-full text-sm font-medium"
              >
                Mulai Topup
              </button>
              <button
                onClick={() => { setShow(false); router.push("/#layanan") }}
                className="flex-1 border border-primary text-primary py-2 rounded-full text-sm font-medium"
              >
                Lihat Layanan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
