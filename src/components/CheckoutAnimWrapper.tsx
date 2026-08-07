"use client"
import dynamic from "next/dynamic"

const CheckoutAnim = dynamic(() => import("./CheckoutAnim"), {
  ssr: false,
  loading: () => (
    <div className="h-48 flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
    </div>
  ),
})

export default function CheckoutAnimWrapper() {
  return <CheckoutAnim />
}
