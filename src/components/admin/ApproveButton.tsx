"use client"

import { useRouter } from "next/navigation"

export default function ApproveButton({ id }: { id: string }) {
  const router = useRouter()
  const approve = async () => {
    await fetch(`/api/admin/reviews/${id}/approve`, { method: "PUT" })
    router.refresh()
  }
  return <button onClick={approve} className="bg-green-500 text-white px-3 py-1 rounded text-sm">Setujui</button>
}