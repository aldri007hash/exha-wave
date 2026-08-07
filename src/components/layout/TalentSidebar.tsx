"use client";
import Link from "next/link"; import { usePathname } from "next/navigation"; import { useSession, signOut } from "next-auth/react"; import { cn } from "@/lib/utils";
import { LayoutDashboard, Briefcase, Search, History, Users, MessageSquare, User, LogOut, ArrowLeft, CreditCard } from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/talent" }, { icon: Briefcase, label: "Tugas Saya", href: "/talent/jobs" },
  { icon: Search, label: "Job Tersedia", href: "/talent/available" }, { icon: History, label: "Riwayat", href: "/talent/history" },
  { icon: Users, label: "Anggota Tim", href: "/talent/members" }, { icon: MessageSquare, label: "Group Chat", href: "/talent/group-chat" },
  { icon: CreditCard, label: "Metode Bayar", href: "/talent/payment-methods" }, { icon: User, label: "Profil Saya", href: "/talent/profile" },
];

export default function TalentSidebar() {
  const pathname = usePathname(); const { data: session } = useSession();
  return (
    <aside className="hidden md:flex w-64 h-screen flex-col flex-shrink-0 overflow-y-auto bg-[#4A0E2E] dark:bg-[#2D0A1C] text-[#F5E6D3]">
      <div className="p-4 border-b border-[#6B1D40]"><h1 className="text-xl font-bold text-[#C9A96E]">Exha Wave</h1><p className="text-xs text-[#D4B896]">Talent Panel</p></div>
      <nav className="flex-1 p-2 space-y-1">{menuItems.map(item => { const isActive = pathname === item.href || (item.href !== "/talent" && pathname.startsWith(item.href)); return <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors", isActive ? "bg-[#800020] text-white" : "text-[#F5E6D3] hover:bg-[#6B1D40]")}><item.icon size={18} /><span>{item.label}</span></Link> })}</nav>
      <div className="p-4 border-t border-[#6B1D40] text-xs flex flex-col gap-2 text-[#D4B896]"><Link href="/dashboard" className="flex items-center gap-2 hover:text-white text-sm text-[#F5E6D3]"><ArrowLeft size={16} /> Back to Website</Link><button onClick={() => signOut({ callbackUrl: "/login" })} className="flex items-center gap-2 hover:text-white text-sm text-[#F5E6D3]"><LogOut size={16} /> Logout</button></div>
    </aside>
  );
}
