"use client"

export default function EditServiceButton({ service }: { service: { id: string; name: string } }) {
  return <button className="rounded bg-yellow-500 px-3 py-1 text-sm text-white">Edit</button>
}
