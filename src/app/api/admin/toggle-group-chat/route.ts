import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const { enabled } = await req.json()

  // Simpan pengaturan
  const setting = await prisma.setting.upsert({
    where: { key: "groupChatEnabled" },
    update: { value: enabled ? "true" : "false" },
    create: { key: "groupChatEnabled", value: enabled ? "true" : "false" },
  })

  return NextResponse.json({ success: true, enabled: setting.value === "true" })
}

export async function GET() {
  const setting = await prisma.setting.findUnique({ where: { key: "groupChatEnabled" } })
  const enabled = setting?.value !== "false"
  return NextResponse.json({ enabled })
}
