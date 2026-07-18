// Untuk upload file ke Cloudinary (foto profil, audio)
export async function uploadToCloudinary(file: File, folder: string) {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("upload_preset", "exha_wave") // buat upload preset di Cloudinary
  formData.append("folder", folder)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/auto/upload`, {
    method: "POST",
    body: formData,
  })

  const data = await res.json()
  return { url: data.secure_url, publicId: data.public_id }
}