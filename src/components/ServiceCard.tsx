"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatCurrency, platformColors } from "@/lib/utils";
import type { Platform, Service } from "@prisma/client";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

const orderSchema = z.object({
  targetLink: z.string().min(1, "Link target wajib diisi").url("Format URL tidak valid"),
  profileName: z.string().optional(),
  quantity: z.number({ invalid_type_error: "Jumlah harus angka" }).min(1, "Jumlah minimal 1"),
});

type OrderForm = z.infer<typeof orderSchema>;

interface Props {
  platform: Platform;
  service: Service;
}

export default function ServiceCard({ platform, service }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<OrderForm>({
    resolver: zodResolver(orderSchema),
    defaultValues: { targetLink: "", profileName: "", quantity: service.minOrder },
  });

  const quantity = watch("quantity") || service.minOrder;
  const price = Math.round((quantity / service.minOrder) * service.pricePerUnit);

  const onSubmit = async (data: OrderForm) => {
    setLoading(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          targetLink: data.targetLink,
          profileName: data.profileName,
          quantity: data.quantity,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menambahkan ke keranjang");
      }
      setShowModal(false);
      router.refresh(); // Refresh halaman untuk update cart count
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const colors = platformColors[platform.name] || {
    border: "border-border",
    shadow: "shadow-none",
    text: "text-foreground",
    gradient: "from-primary to-accent",
  };

  return (
    <>
      <div
        className={`bg-card border-2 rounded-xl p-4 flex flex-col gap-2 transition-all duration-300 hover:shadow-lg ${colors.border} ${colors.shadow} hover:scale-[1.02]`}
      >
        <div className="flex items-center gap-2">
          <span className="font-heading font-semibold text-sm">
            {platform.name} - {service.name}
          </span>
        </div>
        <p className="text-xs text-gray-500">
          Min: {service.minOrder} · {formatCurrency(service.pricePerUnit)} / {service.minOrder} unit
        </p>
        <button
          onClick={() => setShowModal(true)}
          className={`ripple bg-gradient-to-r ${colors.gradient} text-white px-4 py-1 rounded-full text-sm mt-auto font-medium shadow-md`}
        >
          Detail & Pesan
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl p-6 w-full max-w-md relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 p-1 hover:bg-card rounded-full"
            >
              <X size={18} />
            </button>
            <h3 className="font-heading text-xl font-semibold mb-4">
              {platform.name} - {service.name}
            </h3>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
              <div>
                <label className="text-sm mb-1 block">Link Target *</label>
                <input
                  {...register("targetLink")}
                  placeholder="https://..."
                  className="border rounded px-3 py-2 w-full bg-transparent"
                />
                {errors.targetLink && (
                  <p className="text-red-500 text-xs mt-1">{errors.targetLink.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm mb-1 block">Nama Profil (opsional)</label>
                <input
                  {...register("profileName")}
                  placeholder="Nama akun"
                  className="border rounded px-3 py-2 w-full bg-transparent"
                />
              </div>
              <div>
                <label className="text-sm mb-1 block">Jumlah *</label>
                <input
                  type="number"
                  {...register("quantity", { valueAsNumber: true })}
                  min={service.minOrder}
                  step={1}
                  className="border rounded px-3 py-2 w-full bg-transparent"
                />
                {errors.quantity && (
                  <p className="text-red-500 text-xs mt-1">{errors.quantity.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Minimal: {service.minOrder} unit</p>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="font-bold text-primary">{formatCurrency(price)}</span>
                <button
                  type="submit"
                  disabled={loading}
                  className="ripple bg-primary text-white px-4 py-2 rounded-full disabled:opacity-50"
                >
                  {loading ? "Menyimpan..." : "+ Keranjang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}