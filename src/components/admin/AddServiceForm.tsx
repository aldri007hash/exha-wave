"use client"

export default function AddServiceForm({ platformId }: { platformId: string }) {
  return (
    <div className="mt-3 rounded-lg border border-dashed border-border p-3 text-sm text-gray-500">
      Form tambah layanan untuk platform {platformId} akan tersedia di tahap berikutnya.
    </div>
  )
}
