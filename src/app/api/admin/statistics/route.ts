import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || ((session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    // Pendapatan per bulan (6 bulan terakhir) dari topup sukses dan order complete
    const today = new Date();
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);

    const topupRevenue = await prisma.topupTransaction.findMany({
      where: {
        status: "SUCCESS",
        createdAt: { gte: sixMonthsAgo },
      },
      select: { amount: true, createdAt: true },
    });

    const orderRevenue = await prisma.order.findMany({
      where: {
        status: "COMPLETED",
        createdAt: { gte: sixMonthsAgo },
      },
      select: { totalPrice: true, createdAt: true },
    });

    // Gabungkan pendapatan per bulan
    const revenueMap: Record<string, number> = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      revenueMap[key] = 0;
    }
    topupRevenue.forEach((t) => {
      const key = `${t.createdAt.getFullYear()}-${String(t.createdAt.getMonth() + 1).padStart(2, "0")}`;
      if (revenueMap[key] !== undefined) revenueMap[key] += t.amount;
    });
    orderRevenue.forEach((o) => {
      const key = `${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth() + 1).padStart(2, "0")}`;
      if (revenueMap[key] !== undefined) revenueMap[key] += o.totalPrice;
    });

    const revenue = Object.entries(revenueMap)
      .map(([month, pendapatan]) => ({ month, pendapatan }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // User login 7 hari terakhir
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const loginLogs = await prisma.activityLog.findMany({
      where: {
        action: "LOGIN",
        createdAt: { gte: sevenDaysAgo },
      },
      select: { createdAt: true },
    });

    const loginByDate: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      loginByDate[key] = 0;
    }
    loginLogs.forEach((l) => {
      const key = l.createdAt.toISOString().slice(0, 10);
      if (loginByDate[key] !== undefined) loginByDate[key]++;
    });

    const activeUsers = Object.entries(loginByDate)
      .map(([date, logins]) => ({ date, logins }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Layanan terlaris (dari OrderItem, 5 teratas)
    const topServicesRaw = await prisma.orderItem.groupBy({
      by: ["serviceId"],
      _count: { serviceId: true },
      orderBy: { _count: { serviceId: "desc" } },
      take: 5,
    });

    const serviceIds = topServicesRaw.map((s) => s.serviceId);
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, name: true },
    });

    const topServices = topServicesRaw.map((item) => ({
      name: services.find((s) => s.id === item.serviceId)?.name || "Unknown",
      count: item._count.serviceId,
    }));

    return NextResponse.json({ revenue, activeUsers, topServices });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}