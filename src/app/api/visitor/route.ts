import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const { page, ip, browser, device, userId } = await req.json()

  try {
    await prisma.visitorLog.create({
      data: {
        page,
        ip: ip || "unknown",
        browser: browser || "Unknown",
        device: device || "Unknown",
        userId: userId || null,
      },
    })
  } catch (error) {
    console.error("Gagal mencatat visitor:", error)
  }

  return NextResponse.json({ success: true })
}