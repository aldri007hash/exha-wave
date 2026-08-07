"use client";

import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import {
  Menu, X, LogOut, User, Settings, ChevronDown,
  LayoutDashboard, Briefcase, Search, History, Users, MessageSquare, ArrowLeft, CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function TalentHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    if (pathname === "/talent") return "Dashboard";
    const segment = pathname.split("/").pop();
    if (!segment) return "Talent";
    return segment.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/talent" },
    { icon: Briefcase, label: "Tugas Saya", href: "/talent/jobs" },
    { icon: Search, label: "Job Tersedia", href: "/talent/available" },
    { icon: History, label: "Riwayat", href: "/talent/history" },
    { icon: Users, label: "Anggota Tim", href: "/talent/members" },
    { icon: MessageSquare, label: "Group Chat", href: "/talent/group-chat" },
    { icon: CreditCard, label: "Metode Bayar", href: "/talent/payment-methods" },
    { icon: User, label: "Profil Saya", href: "/talent/profile" },
  ];

  return (
    <>
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={closeMobileMenu} />
      )}
      <div className={cn("md:hidden fixed top-0 left-0 z-50 h-full w-72 bg-[#4A0E2E] text-white transform transition-transform overflow-y-auto", mobileMenuOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="p-4 border-b border-[#6B1D40] flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#C9A96E]">Talent Panel</h2>
          <button onClick={closeMobileMenu} className="p-1 hover:bg-[#6B1D40] rounded-full"><X size={20} /></button>
        </div>
        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/talent" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} onClick={closeMobileMenu} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm", isActive ? "bg-[#800020] text-white" : "text-[#F5E6D3] hover:bg-[#6B1D40]")}>
                <item.icon size={18} /><span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[#6B1D40] flex flex-col gap-2">
          <Link href="/dashboard" onClick={closeMobileMenu} className="flex items-center gap-2 text-sm text-[#F5E6D3]"><ArrowLeft size={16} /> Back to Website</Link>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex items-center gap-2 text-sm text-[#F5E6D3]"><LogOut size={16} /> Logout</button>
        </div>
      </div>

      <header className="flex items-center justify-between flex-shrink-0 px-4 lg:px-6 py-3 border-b relative overflow-hidden" style={{ background: "linear-gradient(135deg, #F5E6D3 0%, #D4B896 25%, #C9A96E 50%, #D4B896 75%, #F5E6D3 100%)", backgroundSize: "200% 200%", animation: "gradientShift 6s ease infinite", borderColor: "#D4B896" }}>
        <style jsx>{`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-1 rounded-full text-[#4A0E2E] dark:text-[#C9A96E]" aria-label="Buka menu"><Menu size={22} /></button>
          <div>
            <h2 className="text-lg font-semibold text-[#4A0E2E] dark:text-[#C9A96E]">{getPageTitle()}</h2>
            <p className="text-xs text-[#6B1D40] dark:text-[#D4B896]">Talent Panel Exha Wave</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 text-sm text-[#4A0E2E] dark:text-[#C9A96E]">
              <div className="w-8 h-8 rounded-full bg-[#800020] flex items-center justify-center">
                <User size={18} className="text-[#C9A96E]" />
              </div>
              <span className="hidden sm:inline font-medium">{session?.user?.name || "Talent"}</span>
              <ChevronDown size={16} />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg border py-1 z-50 bg-[#F5E6D3] dark:bg-[#3D2A2A] border-[#D4B896] dark:border-[#5A3A3A]">
                <Link href="/talent/profile" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-[#E8D5C0] dark:hover:bg-[#4A2A2A] text-[#4A0E2E] dark:text-[#F5E6D3]" onClick={() => setDropdownOpen(false)}><Settings size={16} /> Profil</Link>
                <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex items-center gap-2 px-4 py-2 text-sm w-full text-left text-[#800020] dark:text-red-400"><LogOut size={16} /> Keluar</button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
