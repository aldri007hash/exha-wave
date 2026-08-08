import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({ message: "Exha Wave Reseller API v1.0" }, { status: 200 })
}
