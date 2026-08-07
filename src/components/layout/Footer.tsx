import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border py-2 md:py-4 mt-auto pb-20 md:pb-4">
      <div className="max-w-7xl mx-auto px-4 text-center text-[10px] md:text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center justify-center gap-x-2 md:gap-x-3 gap-y-0.5 mb-1">
          <span className="font-semibold text-foreground text-xs md:text-sm">Exha Wave</span>
          <span className="hidden sm:inline text-gray-400">•</span>
          <Link href="/syarat-dan-ketentuan" className="hover:text-primary transition-colors">Syarat & Ketentuan</Link>
          <span className="hidden sm:inline text-gray-400">•</span>
          <Link href="/kebijakan-privasi" className="hover:text-primary transition-colors">Kebijakan Privasi</Link>
          <span className="hidden sm:inline text-gray-400">•</span>
          <Link href="/dokumentasi-api" className="hover:text-primary transition-colors">Dokumentasi API</Link>
          <span className="hidden sm:inline text-gray-400">•</span>
          <Link href="/cara-refund" className="hover:text-primary transition-colors">Refund</Link>
          <span className="text-gray-400">/</span>
          <Link href="/cara-komplain" className="hover:text-primary transition-colors">Komplain</Link>
        </div>
        <p>&copy; {new Date().getFullYear()} Exha Wave. All rights reserved.</p>
      </div>
    </footer>
  )
}
