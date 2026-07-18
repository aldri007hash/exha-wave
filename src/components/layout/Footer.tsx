import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border py-6 mt-auto pb-24 md:pb-6">
      <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
        <p className="mb-2">&copy; {new Date().getFullYear()} Exha Wave. All rights reserved.</p>
        <div className="flex justify-center gap-4">
          <Link href="/about" className="hover:text-primary transition-colors">Tentang</Link>
          <Link href="/faq" className="hover:text-primary transition-colors">FAQ</Link>
          <Link href="/contact" className="hover:text-primary transition-colors">Kontak</Link>
        </div>
      </div>
    </footer>
  )
}