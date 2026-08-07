"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatCurrency, platformColors } from "@/lib/utils";
import type { Platform, Service } from "@prisma/client";
import { X, Package, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const MIN_GLOBAL_ORDER = 10;

const orderSchema = z.object({
  targetLink: z.string().min(1, "Target/Tujuan wajib diisi"),
  profileName: z.string().optional(),
  quantity: z.number({ invalid_type_error: "Jumlah harus angka" }).min(MIN_GLOBAL_ORDER, `Jumlah minimal ${MIN_GLOBAL_ORDER}`),
  notes: z.string().optional(),
});

type OrderForm = z.infer<typeof orderSchema>;

interface Props {
  platform: Platform;
  service: Service;
}

const BADGE_CONFIG: Record<string, { text: string; color: string }> = {
  popular:   { text: 'TERPOPULER',    color: 'bg-gradient-to-r from-red-500 to-orange-500' },
  hemat:     { text: 'HEMAT',         color: 'bg-purple-600' },
  flashsale: { text: 'FLASH SALE',    color: 'bg-yellow-400 text-black' },
  baru:      { text: 'BARU',          color: 'bg-green-500' },
  terbatas:  { text: 'STOK TERBATAS', color: 'bg-pink-500' },
}

export default function ServiceCard({ platform, service }: Props) {
  const { data: session } = useSession();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const isBundle = (service as any).type === "BUNDLE";
  const bundleItems = (service as any).bundleItems || [];
  const bundlePrice = (service as any).bundlePrice || 0;
  const badge = (service as any).badge ? BADGE_CONFIG[(service as any).badge] : null;
  const hasGaransi = (service as any).hasGaransi || false;
  const effectiveMinOrder = Math.max(service.minOrder, MIN_GLOBAL_ORDER);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<OrderForm>({
    resolver: zodResolver(orderSchema),
    defaultValues: { targetLink: "", profileName: "", quantity: effectiveMinOrder, notes: "" },
  });

  const quantity = watch("quantity") || effectiveMinOrder;
  const price = isBundle ? bundlePrice : Math.round((quantity / effectiveMinOrder) * service.pricePerUnit);

  const calculateOriginalTotal = () => {
    if (!isBundle || !bundleItems.length) return 0;
    return bundleItems.reduce((sum: number, item: any) => {
      const itemPrice = item.pricePerUnit || 0;
      const itemQuantity = item.quantity || 0;
      const itemMinOrder = item.minOrder || 1000;
      return sum + Math.round((itemPrice / itemMinOrder) * itemQuantity);
    }, 0);
  };

  const originalTotal = calculateOriginalTotal();

  const handleAddToCart = async (data: OrderForm) => {
    if (!session?.user) {
      alert("Silakan login terlebih dahulu untuk memesan.");
      router.push("/login");
      return;
    }
    if (data.quantity < effectiveMinOrder) { alert(`Minimal order: ${effectiveMinOrder} unit`); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: service.id, targetLink: data.targetLink, profileName: data.profileName, quantity: data.quantity, notes: data.notes }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Gagal"); }
      setShowModal(false); router.refresh();
    } catch (error: any) { alert(error.message); }
    setLoading(false);
  };

  const handleOpenModal = () => {
    if (!session?.user) {
      alert("Silakan login terlebih dahulu untuk memesan.");
      router.push("/login");
      return;
    }
    setShowModal(true);
  };

  const colors = platformColors[platform.name] || { border: "border-border", shadow: "shadow-none", text: "text-foreground", gradient: "from-primary to-accent" };

  return (
    <>
      <div className={`bg-card border-2 rounded-xl p-4 flex flex-col gap-2 transition-all duration-300 hover:shadow-lg ${colors.border} ${colors.shadow} hover:scale-[1.02] relative overflow-hidden ${isBundle ? "border-purple-400 shadow-purple-100 dark:border-purple-600" : ""}`}>
        {badge && (
          <div className={`absolute top-4 -right-10 ${badge.color} text-white text-[10px] font-extrabold px-12 py-1.5 shadow-lg uppercase tracking-wider overflow-hidden`} style={{ transform: 'rotate(45deg)' }}>
            {badge.text}<div className="shimmer"></div>
          </div>
        )}
        <div className="flex items-center gap-2 pt-2 flex-wrap">
          <span className="font-heading font-semibold text-sm">{platform.name} - {service.name}</span>
          {isBundle && <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">PAKET HEMAT</span>}
          {hasGaransi && <span className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5"><Shield size={10} /> GARANSI</span>}
        </div>
        <p className="text-xs text-gray-500">
          Min: {effectiveMinOrder} ·{" "}
          {isBundle ? <><span className="line-through text-red-400 mr-1">{formatCurrency(originalTotal)}</span> {formatCurrency(bundlePrice)} / paket</> : <>{formatCurrency(service.pricePerUnit)} / {effectiveMinOrder} unit</>}
        </p>
        {isBundle && bundleItems.length > 0 && (
          <ul className="text-[10px] text-gray-400 mt-1 space-y-0.5">
            {bundleItems.map((item: any, idx: number) => (
              <li key={idx} className="flex items-center gap-1">
                <Package size={10} /> {item.name || "Layanan"} ({item.quantity}x) - Rp {Math.round(((item.pricePerUnit || 0) / (item.minOrder || 1000)) * item.quantity).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
        <button onClick={handleOpenModal} className={`ripple bg-gradient-to-r ${colors.gradient} text-white px-4 py-1 rounded-full text-sm mt-auto font-medium shadow-md`}>Detail & Pesan</button>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl p-6 w-full max-w-md relative">
            <button onClick={() => setShowModal(false)} className="absolute top-3 right-3 p-1 hover:bg-card rounded-full"><X size={18} /></button>
            <h3 className="font-heading text-xl font-semibold mb-4">{platform.name} - {service.name}</h3>
            {isBundle && (
              <div className="mb-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-3">
                <p className="text-xs font-medium mb-2">Paket ini mencakup:</p>
                <ul className="text-xs space-y-1">
                  {bundleItems.map((item: any, idx: number) => (
                    <li key={idx} className="flex justify-between">
                      <span>{item.name} ({item.quantity}x)</span>
                      <span>Rp {Math.round(((item.pricePerUnit || 0) / (item.minOrder || 1000)) * item.quantity).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs mt-2 font-bold text-primary">Harga Paket: {formatCurrency(bundlePrice)}</p>
              </div>
            )}
            {hasGaransi && (
              <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
                <p className="text-xs font-medium flex items-center gap-1"><Shield size={14} className="text-green-600" /> Layanan ini BERGARANSI</p>
              </div>
            )}
            <form onSubmit={handleSubmit(handleAddToCart)} className="flex flex-col gap-3">
              <div><label className="text-sm mb-1 block">Target/Tujuan *</label><input {...register("targetLink")} placeholder="Masukkan link target..." className="border rounded px-3 py-2 w-full bg-transparent" />{errors.targetLink && <p className="text-red-500 text-xs mt-1">{errors.targetLink.message}</p>}</div>
              <div><label className="text-sm mb-1 block">Nama Profil (opsional)</label><input {...register("profileName")} placeholder="Nama akun" className="border rounded px-3 py-2 w-full bg-transparent" /></div>
              <div><label className="text-sm mb-1 block">Jumlah *</label><input type="number" {...register("quantity", { valueAsNumber: true })} min={effectiveMinOrder} step={1} className="border rounded px-3 py-2 w-full bg-transparent" />{errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity.message}</p>}<p className="text-xs text-gray-500 mt-1">Minimal: {effectiveMinOrder} unit</p></div>
              <div><label className="text-sm mb-1 block">Catatan (opsional)</label><textarea {...register("notes")} placeholder="Tambahkan catatan..." rows={2} className="border rounded px-3 py-2 w-full bg-transparent" /></div>
              <div className="flex justify-between items-center mt-2">
                <span className="font-bold text-primary">{formatCurrency(price)}</span>
                <button type="submit" disabled={loading} className="ripple bg-primary text-white px-4 py-2 rounded-full disabled:opacity-50">{loading ? "Menyimpan..." : "+ Keranjang"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
