"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface CartItem {
  id: string;
  service: {
    name: string;
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

  useEffect(() => {
    fetchCart();
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
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-card border border-border rounded-xl p-4 flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">
                {item.service.platform.name} - {item.service.name}
              </p>
              <p className="text-sm text-gray-500">Link: {item.targetLink}</p>
              {item.profileName && (
                <p className="text-sm text-gray-500">Profil: {item.profileName}</p>
              )}
              <p className="text-sm">
                {item.quantity} x {formatCurrency(item.price / item.quantity)} ={" "}
                <strong>{formatCurrency(item.price)}</strong>
              </p>
            </div>
            <button
              onClick={() => handleRemove(item.id)}
              className="text-red-500 hover:text-red-700"
              title="Hapus"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
      <div className="bg-card border border-border rounded-xl p-4 mt-4 flex justify-between items-center">
        <span className="font-semibold text-lg">
          Total: {formatCurrency(totalAmount)}
        </span>
        <Link
          href="/checkout"
          className="bg-primary text-white px-6 py-2 rounded-full"
        >
          Checkout
        </Link>
      </div>
    </div>
  );
}