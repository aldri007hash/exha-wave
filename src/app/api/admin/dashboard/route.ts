import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const [totalUsers, totalOrders, topupSuccess, recentActivities] = await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.topupTransaction.aggregate({
        _sum: { amount: true },
        where: { status: { in: ["SUCCESS", "APPROVED"] } }, // ← perbaikan
      }),
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { email: true, name: true },
          },
        },
      }),
    ]);

    const totalRevenue = topupSuccess._sum.amount || 0;

    return NextResponse.json({
      totalUsers,
      totalOrders,
      totalRevenue,
      recentActivities: recentActivities.map((log) => ({
        id: log.id,
        adminEmail: log.user.email,
        adminName: log.user.name,
        action: log.action,
        ip: log.ip,
        userAgent: log.userAgent,
        timestamp: log.createdAt,
      })),
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}