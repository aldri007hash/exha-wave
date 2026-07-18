"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ShoppingCart,
  User,
  Menu,
  X,
  Palette,
  Search,
  Mic,
  ChevronDown,
  MessageCircle,
  Wallet,
  LayoutDashboard,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import MobileDrawer from "@/components/MobileDrawer";
import NotificationBell from "@/components/NotificationBell";

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [themeDropdown, setThemeDropdown] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [cartCount, setCartCount] = useState(0);

  const isAdminPage = pathname.startsWith("/admin");
  const isAdminUser =
    session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  // Fetch cart count dari API
  useEffect(() => {
    if (session?.user && !isAdminPage) {
      fetch("/api/cart")
        .then((res) => res.json())
        .then((data) => setCartCount(data.cart?.items?.length || 0))
        .catch(() => {});
    }
  }, [session, isAdminPage, pathname]);

  const themes = [
    { name: "Terang", value: "light", color: "#ffffff" },
    { name: "Gelap", value: "dark", color: "#0a0a0a" },
    { name: "Hijau", value: "green", color: "#00FF88" },
    { name: "Ungu", value: "purple", color: "#8B5CF6" },
  ] as const;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/#layanan?q=${encodeURIComponent(searchQuery)}`);
    setSearchOpen(false);
    setSearchQuery("");
  };

  const startVoice = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Browser tidak mendukung voice search");
      return;
    }
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "id-ID";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      router.push(`/#layanan?q=${encodeURIComponent(transcript)}`);
      setSearchOpen(false);
    };
    recognition.onerror = (event: any) => {
      setIsListening(false);
      console.error("Voice error", event.error);
    };
    recognition.start();
    recognitionRef.current = recognition;
  };

  // Header minimal untuk halaman admin
  if (isAdminPage) {
    return (
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/50 shadow-lg shadow-black/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Image
              src="/logo.png"
              alt="Exha Wave"
              width={40}
              height={40}
              className="h-10 w-auto"
              priority
            />
            <span className="font-heading text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent hidden sm:block">
              Exha Wave
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Link href="/profile" className="p-2 hover:bg-card rounded-full">
              {session?.user?.image ? (
                <Image
                  src={session.user.image}
                  alt="Profile"
                  width={32}
                  height={32}
                  className="rounded-full w-7 h-7 object-cover ring-2 ring-primary/20"
                />
              ) : (
                <User size={20} />
              )}
            </Link>
          </div>
        </div>
      </header>
    );
  }

  // Header publik
  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/50 shadow-lg shadow-black/5">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2">
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <Image
            src="/logo.png"
            alt="Exha Wave"
            width={40}
            height={40}
            className="h-10 w-auto"
            priority
          />
          <span className="font-heading text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent hidden sm:block">
            Exha Wave
          </span>
        </Link>

        <div className="flex-1 mx-4 flex items-center gap-2">
          {searchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center gap-2 w-full">
              <input
                type="text"
                placeholder="Cari layanan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-border rounded-full px-4 py-1.5 text-sm bg-background/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
              />
              <button type="submit" className="p-1.5 hover:bg-card rounded-full">
                <Search size={18} />
              </button>
              <button
                type="button"
                onClick={startVoice}
                className={`p-1.5 hover:bg-card rounded-full ${isListening ? "text-red-500" : ""}`}
              >
                <Mic size={18} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
                className="p-1.5 hover:bg-card rounded-full"
              >
                <X size={18} />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 hover:bg-card rounded-full ml-auto"
            >
              <Search size={20} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="relative hidden sm:block">
            <button
              onClick={() => setThemeDropdown(!themeDropdown)}
              className="p-2 hover:bg-card rounded-full flex items-center gap-1"
            >
              <Palette size={20} />
              <ChevronDown size={12} />
            </button>
            {themeDropdown && (
              <div className="absolute right-0 top-12 bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl p-2 shadow-2xl z-50 min-w-[160px]">
                {themes.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => {
                      setTheme(t.value);
                      setThemeDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm flex items-center gap-3 transition-all hover:bg-primary/10 ${
                      theme === t.value ? "bg-primary/20 font-semibold" : ""
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border-2 border-white/20"
                      style={{ backgroundColor: t.color }}
                    />
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {session?.user && (
            <>
              <Link href="/chat" className="p-2 hover:bg-card rounded-full" title="Live Chat">
                <MessageCircle size={20} />
              </Link>
              <Link href="/topup" className="p-2 hover:bg-card rounded-full" title="Topup Saldo">
                <Wallet size={20} />
              </Link>
            </>
          )}

          <NotificationBell />

          <Link href="/cart" className="p-2 relative hover:bg-card rounded-full">
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </Link>

          {/* LINK ADMIN PANEL (hanya untuk admin/superadmin) */}
          {isAdminUser && (
            <Link
              href="/admin"
              className="p-2 hover:bg-card rounded-full"
              title="Admin Panel"
            >
              <LayoutDashboard size={20} />
            </Link>
          )}

          {session?.user ? (
            <Link href="/profile" className="p-2 hover:bg-card rounded-full">
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt="Profile"
                  width={32}
                  height={32}
                  className="rounded-full w-7 h-7 object-cover ring-2 ring-primary/20"
                />
              ) : (
                <User size={20} />
              )}
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-4 py-1.5 bg-primary text-white rounded-full text-sm font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all"
            >
              Masuk
            </Link>
          )}

          <button
            onClick={() => setMenuOpen(true)}
            className="p-2 hover:bg-card rounded-full"
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      <MobileDrawer isOpen={isMenuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}