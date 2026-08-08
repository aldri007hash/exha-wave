import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const authHeader = req.headers.get("Authorization") || ""
  const host = req.headers.get("host") || ""
  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1")
  
  if (!isLocalhost && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Hapus chat expired
  const deletedChat = await prisma.chatMessage.deleteMany({
    where: { expiresAt: { lte: new Date() } },
  })

  // Hapus notifikasi >30 hari
  const deletedNotif = await prisma.notification.deleteMany({
    where: { createdAt: { lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
  })

  // Hapus activity log >90 hari
  const deletedLogs = await prisma.activityLog.deleteMany({
    where: { createdAt: { lte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
  })

  // Hapus group chat >14 hari
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
  const deletedGroupChat = await prisma.talentGroupChat.deleteMany({
    where: { createdAt: { lte: fourteenDaysAgo } },
  })

  // Hapus permanen data yang sudah soft-delete >30 hari
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const deletedOrders = await prisma.order.deleteMany({
    where: { deletedAt: { lte: thirtyDaysAgo } },
  })
  const deletedUsers = await prisma.user.deleteMany({
    where: { deletedAt: { lte: thirtyDaysAgo } },
  })
  const deletedJobs = await prisma.job.deleteMany({
    where: { deletedAt: { lte: thirtyDaysAgo } },
  })

  return NextResponse.json({
    success: true,
    deletedChatMessages: deletedChat.count,
    deletedNotifications: deletedNotif.count,
    deletedActivityLogs: deletedLogs.count,
    deletedGroupChat: deletedGroupChat.count,
    deletedSoftOrders: deletedOrders.count,
    deletedSoftUsers: deletedUsers.count,
    deletedSoftJobs: deletedJobs.count,
  })
}
