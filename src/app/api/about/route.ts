import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const about = await prisma.aboutPage.findFirst();
    return NextResponse.json({ content: about?.content || "" });
  } catch (error) {
    console.error("Error fetching about page:", error);
    return NextResponse.json({ content: "" });
  }
}