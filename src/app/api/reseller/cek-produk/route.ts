import { NextResponse } from "next/server"

// Endpoint ini hanya untuk mencegah Googlebot mendapatkan 401
export async function GET() {
  return NextResponse.json({ message: "Silakan gunakan API Key untuk mengakses endpoint ini." }, { status: 200 })
}
