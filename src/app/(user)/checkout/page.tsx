"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { formatCurrency } from "@/lib/utils"
import CheckoutAnim from "@/components/CheckoutAnim"

interface CartItem {
  id: string
  serviceId: string
  targetLink: string
  profileName?: string
  quantity: number
  price: number
  service: {
    name: string
    platform: {
      name: string
    }
  }
}

const checkoutSchema = z.object({
  paymentMethod: z.string().min(1, "Pilih metode pembayaran"),
})

type CheckoutForm = z.infer<typeof checkoutSchema>

export default function CheckoutPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartLoading, setCartLoading] = useState(true)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [instruction, setInstruction] = useState<any>(null)
  const [orderCreated, setOrderCreated] = useState(false)
  const [countdown, setCountdown] = useState(10)
  const [loading, setLoading] = useState(false)
  const [userPoints, setUserPoints] = useState(0)
  const [showPointsConfirmation, setShowPointsConfirmation] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)

  // Snapshot untuk halaman sukses
  const [snapshotItems, setSnapshotItems] = useState<CartItem[]>([])
  const [snapshotTotal, setSnapshotTotal] = useState(0)
  const [snapshotDiscount, setSnapshotDiscount] = useState(0)
  const [snapshotFinal, setSnapshotFinal] = useState(0)

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    watch,
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
  })

  const selectedPayment = watch("paymentMethod")

  useEffect(() => {
    if (!session?.user) return
    const fetchCart = async () => {
      try {
        const res = await fetch("/api/cart")
        if (!res.ok) throw new Error("Gagal memuat keranjang")
        const data = await res.json()
        setCartItems(data.cart?.items || [])
      } catch (err) {
        console.error(err)
      } finally {
        setCartLoading(false)
      }
    }
    fetchCart()
  }, [session])

  useEffect(() => {
    fetch("/api/payment/methods")
      .then(res => res.json())
      .then(data => setPaymentMethods(data.methods || []))

    if (session?.user) {
      fetch("/api/profile")
        .then(res => res.json())
        .then(data => setUserPoints(data.points || 0))

      fetch("/api/wallet")
        .then(res => res.json())
        .then(data => setWalletBalance(data.balance || 0))
    }
  }, [session])

  const totalAmount = cartItems.reduce((sum, item) => sum + item.price, 0)

  const pointsValue = Math.floor(userPoints / 10)
  const maxDiscount = totalAmount
  const discount = Math.min(pointsValue, maxDiscount)
  const estimatedFinal = Math.max(0, totalAmount - discount)

  const handlePreCheckout = (e: React.FormEvent) => {
    e.preventDefault()
    if (userPoints > 0) {
      setShowPointsConfirmation(true)
    } else {
      proceedCheckout()
    }
  }

  const proceedCheckout = async () => {
    const formData = getValues()
    if (!session?.user) return alert("Silakan login terlebih dahulu")

    if (formData.paymentMethod === "wallet") {
      if (walletBalance < estimatedFinal) {
        return alert("Saldo Exha Anda tidak mencukupi.")
      }
    }

    setLoading(true)
    setShowPointsConfirmation(false)

    // Simpan snapshot sebelum clear
    setSnapshotItems([...cartItems])
    setSnapshotTotal(totalAmount)
    setSnapshotDiscount(discount)
    setSnapshotFinal(estimatedFinal)

    try {
      const items = cartItems.map(item => ({
        serviceId: item.serviceId,
        targetLink: item.targetLink,
        profileName: item.profileName,
        quantity: item.quantity,
        price: item.price,
      }))

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          paymentMethod: formData.paymentMethod,
          usePoints: userPoints > 0,
        }),
      })

      if (res.ok) {
        const result = await res.json()
        setInstruction(result.instruction)
        setOrderCreated(true)
        setCartItems([]) // hanya clear setelah sukses
        setUserPoints(0)
      } else {
        const text = await res.text()
        let errorMsg = "Gagal membuat pesanan"
        try {
          const errData = JSON.parse(text)
          errorMsg = errData.error || errorMsg
        } catch {}
        alert(errorMsg)
      }
    } catch (err) {
      alert("Terjadi kesalahan. Silakan coba lagi.")
    }
    setLoading(false)
  }

  useEffect(() => {
    if (orderCreated && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [orderCreated, countdown])

  if (cartLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <p>Memuat keranjang...</p>
      </div>
    )
  }

  if (cartItems.length === 0 && !orderCreated) {
    router.push("/cart")
    return null
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-heading text-3xl font-bold mb-6">Checkout</h1>

      {!orderCreated ? (
        <form onSubmit={handlePreCheckout}>
          <div className="bg-card border border-border rounded-xl p-4 mb-4">
            <h3 className="font-semibold mb-2">Ringkasan Pesanan</h3>
            {cartItems.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.service?.platform?.name} - {item.service?.name} ({item.quantity})
                </span>
                <span>{formatCurrency(item.price)}</span>
              </div>
            ))}
            <div className="border-t mt-2 pt-2 font-bold flex justify-between">
              <span>Total</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-500 text-sm mt-1">
                <span>Potongan Exha Points</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between font-bold text-primary mt-1">
                <span>Total Akhir</span>
                <span>{formatCurrency(estimatedFinal)}</span>
              </div>
            )}
          </div>

          {userPoints > 0 && (
            <div className="bg-card border border-border rounded-xl p-4 mb-4">
              <h3 className="font-semibold mb-2">Exha Points Anda</h3>
              <p className="text-sm text-gray-500">
                {userPoints} poin. {discount > 0 && <span className="text-green-500">Akan digunakan Rp {formatCurrency(discount)}</span>}
              </p>
            </div>
          )}

          <div className="bg-card border border-border rounded-xl p-4 mb-4">
            <h3 className="font-semibold mb-2">Metode Pembayaran</h3>
            {errors.paymentMethod && (
              <p className="text-red-500 text-xs mb-2">{errors.paymentMethod.message}</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`border-2 rounded-xl p-3 text-sm cursor-pointer flex items-center gap-3 transition-all ${
                  selectedPayment === "wallet"
                    ? "border-primary bg-primary/10 shadow-md"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPayment === "wallet" ? "border-primary" : "border-gray-400"}`}>
                  {selectedPayment === "wallet" && <div className="w-3 h-3 rounded-full bg-primary" />}
                </div>
                <div>
                  <span className="font-medium">Saldo Exha</span>
                  <p className="text-xs text-muted-foreground">{formatCurrency(walletBalance)} tersedia</p>
                </div>
                <input type="radio" value="wallet" {...register("paymentMethod")} className="hidden" />
              </label>

              {paymentMethods.map((m: any) => (
                <label
                  key={m.id}
                  className={`border-2 rounded-xl p-3 text-sm cursor-pointer flex items-center gap-3 transition-all ${
                    selectedPayment === m.id
                      ? "border-primary bg-primary/10 shadow-md"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPayment === m.id ? "border-primary" : "border-gray-400"}`}>
                    {selectedPayment === m.id && <div className="w-3 h-3 rounded-full bg-primary" />}
                  </div>
                  <span>{m.name}</span>
                  <input type="radio" value={m.id} {...register("paymentMethod")} className="hidden" />
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="ripple w-full bg-primary text-white py-3 rounded-full font-semibold disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Buat Pesanan"}
          </button>
        </form>
      ) : (
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <CheckoutAnim />
          <h2 className="font-heading text-2xl font-bold mt-4">Pesanan Dibuat!</h2>
          <p className="text-gray-500 mt-2">Status: Menunggu Pembayaran</p>
          
          <div className="mt-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-left text-sm">
            <h4 className="font-semibold mb-2">Ringkasan Pesanan Anda</h4>
            {snapshotItems.length > 0 ? (
              snapshotItems.map(item => (
                <div key={item.id} className="flex justify-between">
                  <span>{item.service?.platform?.name} - {item.service?.name} ({item.quantity})</span>
                  <span>{formatCurrency(item.price)}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500">Pesanan telah diproses.</p>
            )}
            <div className="border-t mt-2 pt-2 font-bold flex justify-between">
              <span>Total</span>
              <span>{formatCurrency(snapshotTotal)}</span>
            </div>
            {snapshotDiscount > 0 && (
              <div className="flex justify-between text-green-500 text-sm mt-1">
                <span>Potongan Exha Points</span>
                <span>-{formatCurrency(snapshotDiscount)}</span>
              </div>
            )}
            {snapshotDiscount > 0 && (
              <div className="flex justify-between font-bold text-primary mt-1">
                <span>Total Akhir</span>
                <span>{formatCurrency(snapshotFinal)}</span>
              </div>
            )}
          </div>

          {instruction && (
            <div className="mt-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-left text-sm">
              <h4 className="font-semibold mb-2">Instruksi Pembayaran:</h4>
              <pre className="whitespace-pre-wrap">{instruction.instructions}</pre>
            </div>
          )}
          <button
            onClick={() => router.push("/")}
            disabled={countdown > 0}
            className="ripple mt-6 bg-primary text-white px-8 py-2 rounded-full font-semibold disabled:opacity-50"
          >
            {countdown > 0 ? `Tunggu ${countdown} detik...` : "Selesai"}
          </button>
        </div>
      )}

      {showPointsConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl p-6 max-w-sm w-full text-center">
            <h3 className="font-heading text-xl font-bold mb-2">Konfirmasi Penggunaan Poin</h3>
            <p className="text-sm text-gray-500 mb-4">
              Seluruh Exha Point Anda ({userPoints} poin) akan digunakan untuk potongan {formatCurrency(discount)}. Poin Anda akan kembali ke 0.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowPointsConfirmation(false)} className="border px-4 py-2 rounded-full">Batal</button>
              <button onClick={proceedCheckout} className="bg-primary text-white px-6 py-2 rounded-full">Lanjutkan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}