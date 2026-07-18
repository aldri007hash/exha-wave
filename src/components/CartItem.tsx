"use client"
import { Trash2, Minus, Plus } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

// Definisi tipe item cart yang diterima dari API /api/cart
interface CartItemProps {
  id: string
  serviceId: string
  targetLink: string
  profileName?: string | null
  quantity: number
  price: number
  service: {
    name: string
    platform: {
      name: string
    }
  }
  onRemove: (id: string) => void
  onUpdate?: (id: string, quantity: number) => void
}

export default function CartItem({ id, serviceId, targetLink, profileName, quantity, price, service, onRemove, onUpdate }: CartItemProps) {
  const unitPrice = price / quantity

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex-1">
        <p className="font-semibold text-sm">
          {service.platform.name} - {service.name}
        </p>
        <p className="text-xs text-gray-500 truncate max-w-[300px]">
          Target: {targetLink}
        </p>
        {profileName && (
          <p className="text-xs text-gray-500">
            Profil: {profileName}
          </p>
        )}
        <p className="text-xs text-gray-500">
          {quantity} x {formatCurrency(unitPrice)} = <strong>{formatCurrency(price)}</strong>
        </p>
      </div>
      <div className="flex items-center gap-2 self-end sm:self-center">
        {onUpdate && (
          <div className="flex items-center border border-border rounded-full">
            <button
              type="button"
              onClick={() => {
                if (quantity > 1) onUpdate(id, quantity - 1)
              }}
              className="p-1.5 hover:bg-card rounded-full"
              disabled={quantity <= 1}
            >
              <Minus size={14} />
            </button>
            <span className="px-2 text-sm font-medium">{quantity}</span>
            <button
              type="button"
              onClick={() => onUpdate(id, quantity + 1)}
              className="p-1.5 hover:bg-card rounded-full"
            >
              <Plus size={14} />
            </button>
          </div>
        )}
        <button
          onClick={() => onRemove(id)}
          className="p-2 text-red-500 hover:bg-red-50 rounded-full transition"
          title="Hapus item"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  )
}