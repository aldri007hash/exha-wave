import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const cacheDir = path.join(process.cwd(), "cache")
    if (!fs.existsSync(cacheDir)) {
      return NextResponse.json({ time: 0 })
    }

    const cacheFile = path.join(cacheDir, "broadcast.json")
    if (!fs.existsSync(cacheFile)) {
      return NextResponse.json({ time: 0 })
    }

    const raw = fs.readFileSync(cacheFile, "utf-8")
    if (!raw || !raw.trim()) {
      return NextResponse.json({ time: 0 })
    }

    const data = JSON.parse(raw)
    return NextResponse.json(data)
  } catch (err) {
    console.error("Broadcast latest error:", err)
    return NextResponse.json({ time: 0 })
  }
}
