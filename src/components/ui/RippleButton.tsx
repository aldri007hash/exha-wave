"use client"
import { useRef, useEffect } from "react"

interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  className?: string
}

export default function RippleButton({ children, className = "", ...props }: RippleButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const btn = btnRef.current
    if (!btn) return

    const handleClick = (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const ripple = document.createElement("span")
      ripple.className = "ripple-effect"
      ripple.style.left = `${x}px`
      ripple.style.top = `${y}px`

      btn.appendChild(ripple)
      setTimeout(() => ripple.remove(), 600)
    }

    btn.addEventListener("click", handleClick)
    return () => btn.removeEventListener("click", handleClick)
  }, [])

  return (
    <button ref={btnRef} className={`ripple ${className}`} {...props}>
      {children}
    </button>
  )
}