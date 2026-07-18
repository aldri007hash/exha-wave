"use client"
import { Bell } from "lucide-react"
import { useNotifications } from "@/hooks/useNotification"

export default function AdminHeader({ user }: { user: any }) {
  const { unreadCount } = useNotifications()

  return (
    <header className="bg-card border-b border-border px-6 py-3 flex justify-between items-center">
      <h1 className="font-heading text-lg font-semibold">Admin Panel</h1>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">{user.name}</span>
          <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">ADMIN</span>
        </div>
      </div>
    </header>
  )
}