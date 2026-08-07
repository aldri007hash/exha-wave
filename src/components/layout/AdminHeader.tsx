"use client";

import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import {
  Menu, X, LogOut, User, Settings, ChevronDown,
  LayoutDashboard, ShoppingCart, Package, Users,
  MessageSquare, Star, HelpCircle, Gift, CreditCard,
  History, FileText, BarChart3, MapPin, Shield, UserCog,
  Trophy, Volume2, BellRing, ArrowLeft, PenTool,
  Key, Percent, DollarSign, Lock, RefreshCw, Megaphone, Briefcase, MessagesSquare, Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getPageTitle = () => {
    if (pathname === "/admin") return "Dashboard";
    const segment = pathname.split("/").pop();
    if (!segment) return "Admin";
    return segment.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  // Disinkronkan penuh dengan AdminSidebar
  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
    { icon: ShoppingCart, label: "Pesanan", href: "/admin/orders" },
    { icon: RefreshCw, label: "Refund", href: "/admin/refunds" },
    { icon: Shield, label: "Pengajuan Garansi", href: "/admin/refills" },
    { icon: Package, label: "Layanan", href: "/admin/services" },
    { icon: Users, label: "User", href: "/admin/users" },
    { icon: Briefcase, label: "Jobs / Tugas", href: "/admin/jobs" },
    { icon: Wallet, label: "Bayaran Talent", href: "/admin/talent-payment-methods" },
    { icon: MessageSquare, label: "Chat", href: "/admin/chat" },
    { icon: MessagesSquare, label: "Group Chat", href: "/admin/group-chat" },
    { icon: Megaphone, label: "Pengumuman", href: "/admin/announcements" },
    { icon: Star, label: "Testimoni", href: "/admin/testimonials" },
    { icon: PenTool, label: "Blog", href: "/admin/blog" },
    { icon: HelpCircle, label: "FAQ", href: "/admin/faq" },
    { icon: FileText, label: "Tentang Kami", href: "/admin/about" },
    { icon: Gift, label: "Poin", href: "/admin/points" },
    { icon: CreditCard, label: "Metode Bayar", href: "/admin/payment-methods" },
    { icon: History, label: "Riwayat Topup", href: "/admin/topup-history" },
    { icon: BarChart3, label: "Statistik", href: "/admin/statistics" },
    { icon: MapPin, label: "Visitor Map", href: "/admin/visitor-map" },
    { icon: Trophy, label: "Leaderboard", href: "/admin/leaderboard" },
    { icon: Percent, label: "Promo", href: "/admin/promo" },
    { icon: Volume2, label: "Audio", href: "/admin/audio" },
    { icon: BellRing, label: "Notifikasi Suara", href: "/admin/sounds" },
    { icon: Key, label: "API Key", href: "/admin/api-keys" },
    { icon: Settings, label: "Pengaturan", href: "/admin/settings" },
    ...(isSuperAdmin ? [
      { icon: Shield, label: "Super Dashboard", href: "/admin/super-dashboard" },
      { icon: UserCog, label: "Kelola Admin", href: "/admin/manage-admins" },
      { icon: DollarSign, label: "Laporan Keuangan", href: "/admin/finance" },
      { icon: Lock, label: "Log Keamanan", href: "/admin/security-log" },
    ] : []),
  ];

  return (
    <>
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity" onClick={closeMobileMenu} />
      )}
      <div className={cn("md:hidden fixed top-0 left-0 z-50 h-full w-72 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out overflow-y-auto", mobileMenuOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-bold">Admin Panel</h2>
          <button onClick={closeMobileMenu} className="p-1 hover:bg-gray-700 rounded-full"><X size={20} /></button>
        </div>
        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} onClick={closeMobileMenu} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors", isActive ? "bg-primary text-white font-medium" : "text-gray-300 hover:bg-gray-800 hover:text-white")}>
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-700 flex flex-col gap-2">
          <Link href="/dashboard" onClick={closeMobileMenu} className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm"><ArrowLeft size={16} /><span>Back to Website</span></Link>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm"><LogOut size={16} /><span>Logout</span></button>
        </div>
      </div>

      <header className="admin-header-bg bg-card border-b border-border px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full" aria-label="Buka menu navigasi"><Menu size={22} /></button>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{getPageTitle()}</h2>
            <p className="text-xs text-muted-foreground">Admin Panel Exha Wave</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors focus:outline-none">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center"><User size={18} className="text-primary" /></div>
              <span className="hidden sm:inline font-medium">{session?.user?.name || "Admin"}</span>
              <ChevronDown size={16} />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-lg border border-border py-1 z-50">
                <Link href="/admin/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-background" onClick={() => setDropdownOpen(false)}><Settings size={16} /> Pengaturan</Link>
                <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left"><LogOut size={16} /> Keluar</button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
