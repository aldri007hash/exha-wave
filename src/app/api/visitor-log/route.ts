import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id || null

  // Dapatkan IP dari header (tergantung environment)
  const forwarded = req.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0] : "127.0.0.1"

  // Cek apakah koordinat sudah ada untuk IP ini dalam 24 jam
  const existing = await prisma.visitorLog.findFirst({
    where: {
      ip,
      latitude: { not: null },
      createdAt: { gte: new Date(Date.now() - 86400000) },
    },
  })

  let latitude: number | null = null
  let longitude: number | null = null

  if (!existing) {
    // Dapatkan koordinat dari IP-API (gratis)
    try {
      const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=lat,lon`)
      if (geoRes.ok) {
        const geoData = await geoRes.json()
        latitude = geoData.lat
        longitude = geoData.lon
      }
    } catch (error) {
      console.error("Geolocation failed:", error)
    }
  } else {
    latitude = existing.latitude
    longitude = existing.longitude
  }

  // Simpan visitor log
  await prisma.visitorLog.create({
    data: {
      userId,
      page: req.headers.get("referer") || "/",
      ip,
      browser: req.headers.get("user-agent") || "Unknown",
      device: /Mobile|Android|iPhone/.test(req.headers.get("user-agent") || "") ? "Mobile" : "Desktop",
      latitude,
      longitude,
    },
  })

  return NextResponse.json({ success: true })
}