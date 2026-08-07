import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  let userId: string | null = null
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.id) {
      const userExists = await prisma.user.findUnique({ where: { id: session.user.id } })
      if (userExists) userId = session.user.id
    }
  } catch {}

  const forwarded = req.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0] : "127.0.0.1"

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
    try {
      const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=lat,lon`)
      if (geoRes.ok) {
        const geoData = await geoRes.json()
        latitude = geoData.lat
        longitude = geoData.lon
      }
    } catch {}
  } else {
    latitude = existing.latitude
    longitude = existing.longitude
  }

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
