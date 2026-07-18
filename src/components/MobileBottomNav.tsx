"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingCart, MessageCircle, User, Grid3X3 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/cart")
        .then((res) => res.json())
        .then((data) => setCartCount(data.cart?.items?.length || 0));
    }
  }, [session, pathname]); // refresh saat navigasi

  const links = [
    { href: "/", icon: Home, label: "Beranda" },
    { href: "/#layanan", icon: Grid3X3, label: "Layanan" },
    { href: "/cart", icon: ShoppingCart, label: `Keranjang${cartCount > 0 ? ` (${cartCount})` : ""}` },
    { href: "/chat", icon: MessageCircle, label: "Chat" },
    { href: session?.user ? "/dashboard" : "/login", icon: User, label: session?.user ? "Akun" : "Masuk" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-t border-border py-2 px-4">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs transition-colors ${
              pathname === link.href ? "text-primary" : "text-gray-500 hover:text-foreground"
            }`}
          >
            <link.icon size={20} />
            <span>{link.label}</span>
            {link.href === "/cart" && cartCount > 0 && (
              <span className="absolute -top-1 right-0 bg-primary text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}