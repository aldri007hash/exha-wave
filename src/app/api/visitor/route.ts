import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const { page, ip, browser, device, userId: rawUserId } = await req.json()

  let userId: string | null = null
  if (rawUserId) {
    try {
      const userExists = await prisma.user.findUnique({ where: { id: rawUserId } })
      if (userExists) userId = rawUserId
    } catch {}
  }

  try {
    await prisma.visitorLog.create({
      data: {
        page,
        ip: ip || "unknown",
        browser: browser || "Unknown",
        device: device || "Unknown",
        userId,
      },
    })
  } catch (error) {
    console.error("Gagal mencatat visitor:", error)
  }

  return NextResponse.json({ success: true })
}
