"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  MessageSquare,
  Star,
  HelpCircle,
  Gift,
  CreditCard,
  History,
  FileText,
  BarChart3,
  MapPin,
  Shield,
  UserCog,
  Trophy,
  Volume2,
  BellRing,
  Settings,
  LogOut,
  ArrowLeft,
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: ShoppingCart, label: "Pesanan", href: "/admin/orders" },
  { icon: Package, label: "Layanan", href: "/admin/services" },
  { icon: Users, label: "User", href: "/admin/users" },
  { icon: MessageSquare, label: "Chat", href: "/admin/chat" },
  { icon: Star, label: "Testimoni", href: "/admin/testimonials" },
  { icon: HelpCircle, label: "FAQ", href: "/admin/faq" },
  { icon: FileText, label: "Tentang Kami", href: "/admin/about" },
  { icon: Gift, label: "Poin", href: "/admin/points" },
  { icon: CreditCard, label: "Metode Bayar", href: "/admin/payment-methods" },
  { icon: History, label: "Riwayat Topup", href: "/admin/topup-history" },
  { icon: BarChart3, label: "Statistik", href: "/admin/statistics" },
  { icon: MapPin, label: "Visitor Map", href: "/admin/visitor-map" },
  { icon: Trophy, label: "Leaderboard", href: "/admin/leaderboard" },
  { icon: Shield, label: "Kompetitor", href: "/admin/competitors" },
  { icon: Volume2, label: "Audio", href: "/admin/audio" },
  { icon: BellRing, label: "Notifikasi Suara", href: "/admin/sounds" },
  { icon: Settings, label: "Pengaturan", href: "/admin/settings" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  const allMenuItems = [
    ...menuItems,
    ...(isSuperAdmin
      ? [{ icon: UserCog, label: "Kelola Admin", href: "/admin/manage-admins" }]
      : []),
  ];

  return (
    <aside className="hidden md:flex w-64 h-screen bg-gray-900 text-white flex-col flex-shrink-0 border-r border-gray-700 overflow-y-auto">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold tracking-wide">Exha Wave</h1>
        <p className="text-xs text-gray-400">Admin Panel</p>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {allMenuItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-primary text-white font-medium"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-700 text-xs text-gray-500 flex flex-col gap-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          <span>Back to Website</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
        <p className="mt-1">© 2026 Exha Wave v1.0</p>
      </div>
    </aside>
  );
}