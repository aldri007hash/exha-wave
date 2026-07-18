import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const keys = ["minTopup", "maxTopup", "pointValue", "siteTitle", "supportContact"];
    const settings = await prisma.setting.findMany({
      where: { key: { in: keys } },
    });

    const result: Record<string, string> = {};
    settings.forEach((s) => {
      result[s.key] = s.value;
    });

    // Default values jika tidak ada di DB
    return NextResponse.json({
      minTopup: Number(result.minTopup) || 15000,
      maxTopup: Number(result.maxTopup) || 1000000,
      pointValue: Number(result.pointValue) || 0.1,
      siteTitle: result.siteTitle || "Exha Wave",
      supportContact: result.supportContact || "",
    });
  } catch (error) {
    return NextResponse.json({
      minTopup: 15000,
      maxTopup: 1000000,
      pointValue: 0.1,
      siteTitle: "Exha Wave",
      supportContact: "",
    });
  }
}