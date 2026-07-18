"use client"
import { useEffect, useState } from "react"

interface Location {
  ip: string
  latitude: number
  longitude: number
  browser: string
  device: string
  createdAt: string
}

export default function VisitorMapPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/visitor-locations")
      .then(res => res.json())
      .then(data => {
        setLocations(data.locations || [])
        setLoading(false)
      })
  }, [])

  if (loading) return <p className="text-center py-12">Memuat data...</p>

  // Buat URL untuk iframe OpenStreetMap dengan marker
  const markers = locations
    .filter(loc => loc.latitude && loc.longitude)
    .map(loc => `${loc.latitude},${loc.longitude}`)
    .join("|")

  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=-180,-90,180,90&layer=mapnik&marker=${markers}`

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold mb-6">Realtime Visitor Map</h2>
      <div className="bg-card border border-border rounded-xl overflow-hidden" style={{ height: "70vh" }}>
        {markers ? (
          <iframe
            src={mapUrl}
            style={{ width: "100%", height: "100%", border: "none" }}
            title="Visitor Map"
          />
        ) : (
          <p className="text-center py-12 text-muted-foreground">Belum ada data lokasi pengunjung.</p>
        )}
      </div>
    </div>
  )
}