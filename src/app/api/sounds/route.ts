import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sounds = await prisma.sound.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ sounds });
  } catch (error) {
    console.error("Error fetching sounds:", error);
    return NextResponse.json({ sounds: [] });
  }
}