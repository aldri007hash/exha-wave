"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { formatCurrency } from "@/lib/utils"
import CheckoutAnimWrapper from "@/components/CheckoutAnimWrapper"
import { Copy, Check } from "lucide-react"

interface CartItem {
  id: string
  serviceId: string
  targetLink: string
  profileName?: string
  quantity: number
  price: number
  notes?: string | null
  service: { name: string; platform: { name: string } }
}

const checkoutSchema = z.object({ paymentMethod: z.string().min(1, "Pilih metode pembayaran") })
type CheckoutForm = z.infer<typeof checkoutSchema>

export default function CheckoutPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartLoading, setCartLoading] = useState(true)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [instruction, setInstruction] = useState<any>(null)
  const [orderCreated, setOrderCreated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userPoints, setUserPoints] = useState(0)
  const [showPointsConfirmation, setShowPointsConfirmation] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)
  const [activePromo, setActivePromo] = useState<any>(null)
  const [snapshotItems, setSnapshotItems] = useState<CartItem[]>([])
  const [snapshotTotal, setSnapshotTotal] = useState(0)
  const [snapshotDiscount, setSnapshotDiscount] = useState(0)
  const [snapshotFinal, setSnapshotFinal] = useState(0)
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>("")
  const [copied, setCopied] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors }, getValues, watch } = useForm<CheckoutForm>({ resolver: zodResolver(checkoutSchema) })
  const selectedPayment = watch("paymentMethod")

  useEffect(() => {
    if (!session?.user) return
    const fetchCart = async () => {
      try {
        const res = await fetch("/api/cart")
        if (!res.ok) throw new Error("Gagal memuat keranjang")
        const data = await res.json()
        setCartItems(data.cart?.items || [])
      } catch (err) { console.error(err) } finally { setCartLoading(false) }
    }
    fetchCart()
  }, [session])

  useEffect(() => {
    fetch("/api/payment/methods")
      .then(res => res.json())
      .then(data => setPaymentMethods(data.methods || []))
    if (session?.user) {
      fetch("/api/profile").then(res => res.json()).then(data => setUserPoints(data.points || 0))
      fetch("/api/wallet").then(res => res.json()).then(data => setWalletBalance(data.balance || 0))
    }
    fetch("/api/promo")
      .then(res => res.json())
      .then(data => {
        if (data.promos?.length > 0) {
          const jamSibuk = data.promos.find((p: any) => p.promoType === "JAM_SIBUK")
          if (jamSibuk) setActivePromo(jamSibuk)
        }
      })
  }, [session])

  const totalAmount = cartItems.reduce((sum, item) => sum + item.price, 0)
  const promoDiscount = activePromo ? Math.round(totalAmount * (activePromo.discount / 100)) : 0
  const afterPromo = totalAmount - promoDiscount
  const pointsValue = Math.floor(userPoints / 10)
  const pointsDiscount = Math.min(pointsValue, afterPromo)
  const estimatedFinal = Math.max(0, afterPromo - pointsDiscount)

  const handlePreCheckout = (e: React.FormEvent) => {
    e.preventDefault()
    if (userPoints > 0) setShowPointsConfirmation(true)
    else proceedCheckout()
  }

  const proceedCheckout = async () => {
    const formData = getValues()
    if (!session?.user) return alert("Silakan login terlebih dahulu")
    if (formData.paymentMethod === "wallet" && walletBalance < estimatedFinal) return alert("Saldo Exha Anda tidak mencukupi.")
    setLoading(true)
    setShowPointsConfirmation(false)
    setSelectedPaymentId(formData.paymentMethod)
    setSnapshotItems([...cartItems])
    setSnapshotTotal(totalAmount)
    setSnapshotDiscount(promoDiscount + pointsDiscount)
    setSnapshotFinal(estimatedFinal)
    try {
      const items = cartItems.map(item => ({
        serviceId: item.serviceId,
        targetLink: item.targetLink,
        profileName: item.profileName,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes || null,
      }))
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, paymentMethod: formData.paymentMethod, usePoints: userPoints > 0 }),
      })
      if (res.ok) {
        const result = await res.json()
        setInstruction(result.instruction)
        setOrderCreated(true)
        setCartItems([])
        setUserPoints(0)
      } else {
        const text = await res.text()
        let errorMsg = "Gagal membuat pesanan"
        try { const errData = JSON.parse(text); errorMsg = errData.error || errorMsg } catch {}
        alert(errorMsg)
      }
    } catch { alert("Terjadi kesalahan. Silakan coba lagi.") }
    setLoading(false)
  }

  const handleCopy = (text: string | null) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 2000)
  }

  if (cartLoading) return <div className="max-w-2xl mx-auto px-4 py-8 text-center"><p>Memuat keranjang...</p></div>
  if (cartItems.length === 0 && !orderCreated) { router.push("/cart"); return null }

  const selectedMethod = paymentMethods.find((m: any) => m.id === selectedPayment)
  const selectedMethodAfter = paymentMethods.find((m: any) => m.id === selectedPaymentId)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 text-foreground">
      <h1 className="font-heading text-3xl font-bold mb-6">Checkout</h1>
      {!orderCreated ? (
        <form onSubmit={handlePreCheckout}>
          {activePromo && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-3 mb-4 text-sm text-center text-gray-800 dark:text-yellow-100">
              🎉 Promo {activePromo.title}: Diskon {activePromo.discount}% untuk semua layanan!
            </div>
          )}
          <div className="bg-card border border-border rounded-xl p-4 mb-4">
            <h3 className="font-semibold mb-2">Ringkasan Pesanan</h3>
            {cartItems.map(item => <div key={item.id} className="flex justify-between text-sm"><span>{item.service?.platform?.name} - {item.service?.name} ({item.quantity})</span><span>{formatCurrency(item.price)}</span></div>)}
            <div className="border-t mt-2 pt-2 font-bold flex justify-between"><span>Total</span><span>{formatCurrency(totalAmount)}</span></div>
            {promoDiscount > 0 && <div className="flex justify-between text-green-500 text-sm mt-1"><span>Diskon {activePromo.title} ({activePromo.discount}%)</span><span>-{formatCurrency(promoDiscount)}</span></div>}
            {pointsDiscount > 0 && <div className="flex justify-between text-green-500 text-sm mt-1"><span>Potongan Exha Points</span><span>-{formatCurrency(pointsDiscount)}</span></div>}
            <div className="flex justify-between font-bold text-primary mt-1"><span>Total Akhir</span><span>{formatCurrency(estimatedFinal)}</span></div>
          </div>

          {selectedMethod?.type === "QRIS" && selectedMethod?.qrisImage && (
            <div className="bg-card border border-border rounded-xl p-4 mb-4 text-center">
              <p className="text-sm font-medium mb-2">Scan QRIS di bawah ini:</p>
              <img src={selectedMethod.qrisImage} alt="QRIS" className="max-w-[250px] mx-auto rounded-xl border" />
            </div>
          )}

          {userPoints > 0 && <div className="bg-card border border-border rounded-xl p-4 mb-4"><h3 className="font-semibold mb-2">Exha Points Anda</h3><p className="text-sm text-muted-foreground">{userPoints} poin. {pointsDiscount > 0 && <span className="text-green-500">Akan digunakan Rp {formatCurrency(pointsDiscount)}</span>}</p></div>}
          <div className="bg-card border border-border rounded-xl p-4 mb-4">
            <h3 className="font-semibold mb-2">Metode Pembayaran</h3>
            {errors.paymentMethod && <p className="text-red-500 text-xs mb-2">{errors.paymentMethod.message}</p>}
            <div className="grid grid-cols-2 gap-3">
              <label className={`border-2 rounded-xl p-3 text-sm cursor-pointer flex items-center gap-3 transition-all ${selectedPayment === "wallet" ? "border-primary bg-primary/10 shadow-md" : "border-border hover:border-primary/50"}`}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPayment === "wallet" ? "border-primary" : "border-gray-400"}`}>{selectedPayment === "wallet" && <div className="w-3 h-3 rounded-full bg-primary" />}</div>
                <div><span className="font-medium">Saldo Exha</span><p className="text-xs text-muted-foreground">{formatCurrency(walletBalance)} tersedia</p></div>
                <input type="radio" value="wallet" {...register("paymentMethod")} className="hidden" />
              </label>
              {paymentMethods.map((m: any) => (
                <label key={m.id} className={`border-2 rounded-xl p-3 text-sm cursor-pointer flex items-center gap-3 transition-all ${selectedPayment === m.id ? "border-primary bg-primary/10 shadow-md" : "border-border hover:border-primary/50"}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPayment === m.id ? "border-primary" : "border-gray-400"}`}>{selectedPayment === m.id && <div className="w-3 h-3 rounded-full bg-primary" />}</div>
                  <span>{m.name}</span>
                  <input type="radio" value={m.id} {...register("paymentMethod")} className="hidden" />
                </label>
              ))}
            </div>
          </div>
          <button type="submit" disabled={loading} className="ripple w-full bg-primary text-white py-3 rounded-full font-semibold disabled:opacity-50">{loading ? "Memproses..." : "Buat Pesanan"}</button>
        </form>
      ) : (
        /* ============ HALAMAN "PESANAN DIBUAT" ============ */
        <div className="bg-card border border-border rounded-xl p-6 text-center text-foreground">
          <CheckoutAnimWrapper />
          <h2 className="font-heading text-2xl font-bold mt-4">Pesanan Dibuat!</h2>
          <p className="text-muted-foreground mt-2">Status: Menunggu Pembayaran</p>

          {/* CARD PEMBAYARAN */}
          {selectedMethodAfter && selectedMethodAfter.id !== "wallet" && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm hover:shadow-lg transition duration-300 text-left mt-4">
              <div className="flex items-center gap-3 mb-4">
                <h4 className="font-semibold text-lg text-gray-900 dark:text-white">{selectedMethodAfter.name}</h4>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-xl p-4 text-center mb-4">
                <p className="text-xs text-gray-600 dark:text-gray-300">Total yang harus dibayar</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  Rp {snapshotFinal.toLocaleString('id-ID')}
                </p>
              </div>

              {selectedMethodAfter.type === "QRIS" && selectedMethodAfter.qrisImage && (
                <div className="text-center">
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">Scan QRIS di bawah ini:</p>
                  <img src={selectedMethodAfter.qrisImage} alt="QRIS" className="w-56 h-56 mx-auto rounded-lg border border-gray-200 dark:border-gray-600"/>
                </div>
              )}

              {selectedMethodAfter.type !== "QRIS" && (
                <div className="space-y-3">
                  {selectedMethodAfter.accountNumber && (
                    <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/60 p-3 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">No Tujuan</p>
                        <p className="font-mono font-semibold text-gray-900 dark:text-white">{selectedMethodAfter.accountNumber}</p>
                      </div>
                      <button onClick={() => handleCopy(selectedMethodAfter.accountNumber)} className="flex items-center gap-1.5 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition">
                        {copied === selectedMethodAfter.accountNumber ? <Check size={14}/> : <Copy size={14}/>}
                        {copied === selectedMethodAfter.accountNumber ? 'Tersalin' : 'Salin'}
                      </button>
                    </div>
                  )}
                  {selectedMethodAfter.accountName && (
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                      <span className="text-gray-500 dark:text-gray-400">A/N:</span> {selectedMethodAfter.accountName}
                    </p>
                  )}
                  <button onClick={() => router.push("/orders")} className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 active:scale-95 transition">
                    Saya Sudah Bayar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* PETUNJUK UPLOAD BUKTI */}
          <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 text-left text-sm">
            <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">📌 Setelah Pembayaran</h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-700 dark:text-gray-300">
              <li>Lakukan pembayaran sesuai metode yang Anda pilih.</li>
              <li>Buka halaman <strong>My Orders</strong> (pesanan Anda).</li>
              <li>Cari pesanan ini dan klik tombol <strong>Upload Bukti Pembayaran</strong>.</li>
              <li>Unggah screenshot/struk pembayaran Anda.</li>
              <li>Admin akan memverifikasi dan mengaktifkan pesanan Anda.</li>
            </ol>
          </div>

          {/* RINGKASAN PESANAN */}
          <div className="mt-4 bg-gray-50 dark:bg-gray-800/80 p-4 rounded-lg text-left text-sm">
            <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">Ringkasan Pesanan Anda</h4>
            {snapshotItems.length > 0 ? snapshotItems.map(item => (
              <div key={item.id} className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>{item.service?.platform?.name} - {item.service?.name} ({item.quantity})</span>
                <span>{formatCurrency(item.price)}</span>
              </div>
            )) : <p className="text-gray-500 dark:text-gray-400">Pesanan telah diproses.</p>}
            <div className="border-t border-gray-300 dark:border-gray-600 mt-2 pt-2 font-bold flex justify-between text-gray-900 dark:text-white">
              <span>Total</span><span>{formatCurrency(snapshotTotal)}</span>
            </div>
            {snapshotDiscount > 0 && <>
              <div className="flex justify-between text-green-500 text-sm mt-1">
                <span>Potongan Diskon & Exha Points</span><span>-{formatCurrency(snapshotDiscount)}</span>
              </div>
              <div className="flex justify-between font-bold text-primary mt-1">
                <span>Total Akhir</span><span>{formatCurrency(snapshotFinal)}</span>
              </div>
            </>}
          </div>

          {/* INSTRUKSI PEMBAYARAN */}
          {instruction && (
            <div className="mt-4 bg-gray-50 dark:bg-gray-800/80 p-4 rounded-lg text-left text-sm">
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">Instruksi Pembayaran:</h4>
              <div className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap font-sans">
                {instruction.instructions}
              </div>
            </div>
          )}

          <button onClick={() => router.push("/orders")} className="ripple mt-6 bg-primary text-white px-8 py-2 rounded-full font-semibold">Buka My Orders</button>
        </div>
      )}
      {showPointsConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl p-6 max-w-sm w-full text-center">
            <h3 className="font-heading text-xl font-bold mb-2">Konfirmasi Penggunaan Poin</h3>
            <p className="text-sm text-muted-foreground mb-4">Seluruh Exha Point Anda ({userPoints} poin) akan digunakan untuk potongan {formatCurrency(pointsDiscount)}. Poin Anda akan kembali ke 0.</p>
            <div className="flex gap-3 justify-center"><button onClick={() => setShowPointsConfirmation(false)} className="border px-4 py-2 rounded-full">Batal</button><button onClick={proceedCheckout} className="bg-primary text-white px-6 py-2 rounded-full">Lanjutkan</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
