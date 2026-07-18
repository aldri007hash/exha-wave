"use client"
import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
})

interface Location {
  ip: string
  latitude: number
  longitude: number
  browser: string
  device: string
  createdAt: string
}

export default function VisitorMap() {
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

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden" style={{ height: "70vh" }}>
      <MapContainer center={[0, 0]} zoom={2} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map((loc, idx) => (
          <Marker key={idx} position={[loc.latitude, loc.longitude]}>
            <Popup>
              <div className="text-sm">
                <p><strong>IP:</strong> {loc.ip}</p>
                <p><strong>Browser:</strong> {loc.browser}</p>
                <p><strong>Device:</strong> {loc.device}</p>
                <p><strong>Waktu:</strong> {new Date(loc.createdAt).toLocaleString("id-ID")}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}