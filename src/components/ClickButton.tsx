"use client"
import { useClickSound } from "@/hooks/useSound"
import { ButtonHTMLAttributes, forwardRef } from "react"

interface ClickButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

const ClickButton = forwardRef<HTMLButtonElement, ClickButtonProps>(
  ({ onClick, children, ...props }, ref) => {
    const playClick = useClickSound()

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      playClick()
      if (onClick) onClick(e)
    }

    return (
      <button ref={ref} onClick={handleClick} {...props}>
        {children}
      </button>
    )
  }
)

ClickButton.displayName = "ClickButton"

export default ClickButton