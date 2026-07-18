import { NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import path from "path"

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get("file") as File
  const folder = formData.get("folder") as string || "chat"

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = Date.now() + "-" + file.name.replace(/\s/g, "_")
  const dir = path.join(process.cwd(), "public", "uploads", folder)
  await require("fs/promises").mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, filename), buffer)

  const url = `/uploads/${folder}/${filename}`
  return NextResponse.json({ url })
}