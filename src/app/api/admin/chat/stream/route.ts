import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  return NextResponse.json({ message: "SSE dinonaktifkan sementara" }, { status: 503 })
}
