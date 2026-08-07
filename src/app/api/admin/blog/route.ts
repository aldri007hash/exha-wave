import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "10")

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.blogPost.count(),
  ])

  return NextResponse.json({
    posts,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { title, content, excerpt, image, published } = await req.json()
  if (!title || !content) return NextResponse.json({ error: "Judul dan konten wajib" }, { status: 400 })

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

  const post = await prisma.blogPost.create({
    data: { title, slug, content, excerpt, image, published },
  })

  return NextResponse.json({ post }, { status: 201 })
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, title, content, excerpt, image, published } = await req.json()
  if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 })

  const data: any = {}
  if (title !== undefined) {
    data.title = title
    data.slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  }
  if (content !== undefined) data.content = content
  if (excerpt !== undefined) data.excerpt = excerpt
  if (image !== undefined) data.image = image
  if (published !== undefined) data.published = published

  await prisma.blogPost.update({ where: { id }, data })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 })

  await prisma.blogPost.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
