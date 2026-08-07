"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Trash2, Package, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

interface CartItem {
  id: string;
  service: {
    name: string;
    type: string;
    bundleItems?: any[];
    bundlePrice?: number;
    hasGaransi: boolean;
    platform: { name: string };
  };
  targetLink: string;
  profileName: string;
  quantity: number;
  price: number;
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePromo, setActivePromo] = useState<any>(null);
  const router = useRouter();

  const fetchCart = async () => {
    try {
      const res = await fetch("/api/cart");
      if (!res.ok) throw new Error("Gagal memuat keranjang");
      const data = await res.json();
      setItems(data.cart?.items || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivePromo = async () => {
    try {
      const res = await fetch("/api/promo");
      const data = await res.json();
      if (data.promos?.length > 0) {
        const jamSibuk = data.promos.find((p: any) => p.promoType === "JAM_SIBUK");
        if (jamSibuk) {
          setActivePromo(jamSibuk);
        } else {
          setActivePromo(null);
        }
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchCart();
    fetchActivePromo();
  }, []);

  const handleRemove = async (itemId: string) => {
    if (!confirm("Hapus item ini?")) return;
    try {
      const res = await fetch(`/api/cart?itemId=${itemId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");
      fetchCart();
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + item.price, 0);
  
  // Hitung estimasi diskon jam sibuk
  const promoDiscount = activePromo ? Math.round(totalAmount * (activePromo.discount / 100)) : 0;
  const estimatedFinal = totalAmount - promoDiscount;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p>Memuat keranjang...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center text-red-500">
        {error}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h1 className="font-heading text-3xl font-bold mb-4">Keranjang</h1>
        <p className="text-gray-500 mb-4">Keranjang kamu kosong.</p>
        <Link href="/#layanan" className="text-primary">
          Lihat Layanan
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-heading text-3xl font-bold mb-6">Keranjang</h1>
      
      {activePromo && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-3 mb-4 text-sm text-center text-gray-800 dark:text-yellow-100">
          🎉 Promo {activePromo.title}: Diskon {activePromo.discount}% untuk semua layanan!
        </div>
      )}

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-card border border-border rounded-xl p-4 flex justify-between items-start"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold">
                  {item.service.platform.name} - {item.service.name}
                </p>
                {item.service.type === "BUNDLE" && (
                  <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    PAKET HEMAT
                  </span>
                )}
                {/* BADGE GARANSI */}
                {item.service.hasGaransi && (
                  <span className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                    <Shield size={10} /> GARANSI
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">Link: {item.targetLink}</p>
              {item.profileName && (
                <p className="text-sm text-gray-500">Profil: {item.profileName}</p>
              )}
              {item.service.type === "BUNDLE" && item.service.bundleItems?.length > 0 && (
                <ul className="text-[10px] text-gray-400 mt-1 space-y-0.5">
                  {item.service.bundleItems.map((b: any, idx: number) => (
                    <li key={idx} className="flex items-center gap-1">
                      <Package size={10} /> {b.name || "Layanan"} ({b.quantity}x)
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-sm mt-1">
                {item.quantity} x{" "}
                {item.service.type === "BUNDLE" ? "Paket" : "unit"} ={" "}
                <strong>{formatCurrency(item.price)}</strong>
              </p>
            </div>
            <button
              onClick={() => handleRemove(item.id)}
              className="text-red-500 hover:text-red-700 ml-2 mt-1"
              title="Hapus"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-4 mt-4">
        <div className="flex justify-between">
          <span>Total</span>
          <span>{formatCurrency(totalAmount)}</span>
        </div>
        {promoDiscount > 0 && (
          <div className="flex justify-between text-green-500 text-sm mt-1">
            <span>Diskon {activePromo.title} ({activePromo.discount}%)</span>
            <span>-{formatCurrency(promoDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
          <span>Estimasi Total</span>
          <span>{formatCurrency(estimatedFinal)}</span>
        </div>
        <Link
          href="/checkout"
          className="mt-4 block w-full bg-primary text-white text-center py-2 rounded-full"
        >
          Checkout
        </Link>
      </div>
    </div>
  );
}
