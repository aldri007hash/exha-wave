import { OrderStatus } from "@prisma/client"

const statusColors = {
  PENDING_PAYMENT: "bg-yellow-100 text-yellow-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  PROGRESS: "bg-indigo-100 text-indigo-800",
  PARTIAL: "bg-orange-100 text-orange-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
}

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[status]}`}>
      {status.replace("_", " ")}
    </span>
  )
}