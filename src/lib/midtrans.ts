import midtransClient from "midtrans-client"

const snap = new midtransClient.Snap({
  isProduction: false, // ganti ke true nanti
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.MIDTRANS_CLIENT_KEY!,
})

export async function createTransaction(orderId: string, amount: number, customer: {
  name: string
  email: string
  phone?: string
}) {
  const parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: amount,
    },
    customer_details: {
      first_name: customer.name,
      email: customer.email,
      phone: customer.phone || "",
    },
    // Callbacks
    callbacks: {
      finish: `${process.env.NEXT_PUBLIC_BASE_URL}/orders?status=success`,
      error: `${process.env.NEXT_PUBLIC_BASE_URL}/orders?status=error`,
      pending: `${process.env.NEXT_PUBLIC_BASE_URL}/orders?status=pending`,
    },
  }

  const transaction = await snap.createTransaction(parameter)
  return transaction
}