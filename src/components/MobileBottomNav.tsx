"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, ShoppingCart, MessageCircle, User, Grid3X3 } from "lucide-react"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => { if (session?.user) { fetch("/api/cart").then(res => res.json()).then(data => setCartCount(data.cart?.items?.length || 0)) } }, [session, pathname])

  const handleLayananClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (pathname === "/") { document.getElementById("layanan")?.scrollIntoView({ behavior: "smooth" }) }
    else { router.push("/#layanan") }
  }

  const links = [
    { href: "/", icon: Home, label: "Beranda" },
    { href: "/#layanan", icon: Grid3X3, label: "Layanan", onClick: handleLayananClick },
    { href: "/cart", icon: ShoppingCart, label: "Keranjang", count: cartCount },
    { href: "/chat", icon: MessageCircle, label: "Chat" },
    { href: session?.user ? "/dashboard" : "/login", icon: User, label: session?.user ? "Akun" : "Masuk" },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t-[1px] border-gray-200 dark:border-white/10 h-[60px]">
      <div className="flex justify-around items-center h-full max-w-lg mx-auto">
        {links.map(link => {
          const isActive = pathname === link.href || (link.href === "/#layanan" && pathname === "/")
          return (
            <Link key={link.href} href={link.href} onClick={link.onClick} className="relative flex flex-col items-center justify-center gap-0.5">
              <motion.div animate={{ y: isActive ? -4 : 0, scale: isActive ? 1.15 : 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className={`${isActive ? "text-primary" : "text-gray-400"}`}>
                <link.icon size={20} />
                {link.count && link.count > 0 ? <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">{link.count}</span> : null}
              </motion.div>
              <span className={`text-[10px] leading-tight ${isActive ? "text-primary font-medium" : "text-gray-400"}`}>{link.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
