"use client"

export default function AudioList({ tracks }: { tracks: Array<{ id: string; title: string; category: string }> }) {
  return (
    <div className="mt-6 space-y-3">
      {tracks.map((track) => (
        <div key={track.id} className="rounded-lg border border-border bg-card p-3">
          <p className="font-semibold">{track.title}</p>
          <p className="text-sm text-gray-500">{track.category}</p>
        </div>
      ))}
    </div>
  )
}
