import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { writeFile } from "fs/promises"
import path from "path"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const setting = await prisma.setting.findUnique({ where: { key: "groupChatEnabled" } })
  const enabled = setting?.value !== "false"

  const messages = await prisma.talentGroupChat.findMany({
    include: { user: { select: { name: true, email: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  return NextResponse.json({ messages: messages.reverse(), enabled })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const setting = await prisma.setting.findUnique({ where: { key: "groupChatEnabled" } })
  if (setting?.value === "false" && session.user.role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Group chat sedang dinonaktifkan" }, { status: 403 })

  const formData = await req.formData()
  const message = formData.get("message") as string
  const image = formData.get("image") as File | null

  let imageUrl: string | null = null

  if (image && image.size > 0) {
    if (session.user.role !== "SUPER_ADMIN")
      return NextResponse.json({ error: "Hanya Superadmin yang bisa mengirim gambar" }, { status: 403 })

    const buffer = Buffer.from(await image.arrayBuffer())
    const filename = `groupchat-${Date.now()}-${image.name.replace(/\s/g, "_")}`
    const dir = path.join(process.cwd(), "public", "uploads", "group-chat")
    await require("fs/promises").mkdir(dir, { recursive: true })
    await writeFile(path.join(dir, filename), buffer)
    imageUrl = `/uploads/group-chat/${filename}`
  }

  if (!message && !imageUrl)
    return NextResponse.json({ error: "Pesan atau gambar diperlukan" }, { status: 400 })

  const chat = await prisma.talentGroupChat.create({
    data: {
      userId: session.user.id,
      message: message || "",
      imageUrl,
    },
    include: { user: { select: { name: true, email: true, role: true } } },
  })

  return NextResponse.json({ chat }, { status: 201 })
}
