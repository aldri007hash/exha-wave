"use client"

import { useEffect } from "react"

export default function AdminThemeInit() {
  useEffect(() => {
    const root = document.documentElement
    
    // Baca tema yang tersimpan
    const savedTheme = localStorage.getItem("theme")
    
    // Hapus semua class tema
    root.classList.remove("theme-dark", "theme-green", "theme-purple")
    
    if (savedTheme && savedTheme !== "light") {
      root.classList.add(`theme-${savedTheme}`)
      root.setAttribute("data-theme", savedTheme)
    } else {
      // Default: cek jam
      const hour = new Date().getHours()
      const autoTheme = (hour >= 18 || hour < 6) ? "dark" : "light"
      if (autoTheme !== "light") {
        root.classList.add(`theme-${autoTheme}`)
        root.setAttribute("data-theme", autoTheme)
      } else {
        root.setAttribute("data-theme", "light")
      }
    }
  }, [])

  return null
}
