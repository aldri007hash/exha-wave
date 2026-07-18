"use client"
import type { Platform, Service } from "@prisma/client"

type PlatformWithServices = Platform & { services: Service[] }

export default function PlatformFilter({
  platforms,
  selected,
  onSelect,
}: {
  platforms: PlatformWithServices[]
  selected: string
  onSelect: (slug: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      <button
        onClick={() => onSelect("")}
        className={`px-4 py-1 rounded-full text-sm ${!selected ? "bg-primary text-white" : "bg-card border border-border"}`}
      >
        Semua
      </button>
      {platforms.map(p => (
        <button
          key={p.id}
          onClick={() => onSelect(p.slug)}
          className={`px-4 py-1 rounded-full text-sm ${selected === p.slug ? "bg-primary text-white" : "bg-card border border-border"}`}
        >
          {p.name}
        </button>
      ))}
    </div>
  )
}