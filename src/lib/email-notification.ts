import { transporter } from "./nodemailer"

export async function sendOrderStatusEmail(
  userEmail: string,
  userName: string,
  orderId: string,
  status: string,
  totalPrice: number,
  items: { name: string; quantity: number; price: number }[]
) {
  const statusMessages: Record<string, string> = {
    PROCESSING: "sedang diproses",
    PROGRESS: "dalam pengerjaan",
    PARTIAL: "mengalami partial",
    COMPLETED: "telah selesai",
    CANCELLED: "dibatalkan",
  }

  const itemsList = items
    .map(item => `<li>${item.name} - ${item.quantity} unit - Rp ${item.price.toLocaleString()}</li>`)
    .join("")

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #0066FF; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Exha Wave</h1>
      </div>
      <div style="padding: 20px;">
        <h2>Halo, ${userName}!</h2>
        <p>Status pesanan Anda <strong>#${orderId.slice(-6)}</strong> telah berubah menjadi <strong>${status}</strong> (${statusMessages[status] || status}).</p>
        <h3>Detail Pesanan:</h3>
        <ul>${itemsList}</ul>
        <p><strong>Total: Rp ${totalPrice.toLocaleString()}</strong></p>
        <p>Silakan cek dashboard Anda untuk informasi lebih lanjut.</p>
        <a href="${process.env.NEXTAUTH_URL}/orders" style="display: inline-block; background-color: #0066FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 12px;">Lihat Pesanan</a>
      </div>
      <div style="background-color: #f5f5f5; padding: 12px; text-align: center; font-size: 12px; color: #888;">
        Exha Wave - Boost Your Social Presence
      </div>
    </div>
  `

  try {
    await transporter.sendMail({
      from: `"Exha Wave" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `[Exha Wave] Status Pesanan #${orderId.slice(-6)} Diperbarui`,
      html,
    })
    console.log(`Email terkirim ke ${userEmail} untuk order ${orderId}`)
  } catch (error) {
    console.error("Gagal mengirim email:", error)
  }
}

export async function sendNewOrderEmailToAdmin(
  adminEmail: string,
  userName: string,
  orderId: string,
  totalPrice: number
) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #0066FF; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Pesanan Baru!</h1>
      </div>
      <div style="padding: 20px;">
        <h2>Pesanan baru dari ${userName}</h2>
        <p>Order ID: <strong>#${orderId.slice(-6)}</strong></p>
        <p>Total: <strong>Rp ${totalPrice.toLocaleString()}</strong></p>
        <p>Segera cek panel admin untuk memproses pesanan ini.</p>
        <a href="${process.env.NEXTAUTH_URL}/admin/orders" style="display: inline-block; background-color: #0066FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 12px;">Buka Admin Panel</a>
      </div>
      <div style="background-color: #f5f5f5; padding: 12px; text-align: center; font-size: 12px; color: #888;">
        Exha Wave - Boost Your Social Presence
      </div>
    </div>
  `

  try {
    await transporter.sendMail({
      from: `"Exha Wave" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: `[Order Baru] #${orderId.slice(-6)} - Rp ${totalPrice.toLocaleString()}`,
      html,
    })
    console.log(`Email notifikasi admin terkirim untuk order ${orderId}`)
  } catch (error) {
    console.error("Gagal mengirim email admin:", error)
  }
}