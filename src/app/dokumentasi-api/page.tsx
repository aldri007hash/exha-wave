export default function ApiDocsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 prose dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-white prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm">
      <h1>📡 Dokumentasi API Exha Wave</h1>
      <p className="lead">
        Selamat datang di API Reseller Exha Wave. Dengan API ini, Anda dapat mengintegrasikan layanan SMM Panel kami langsung ke aplikasi atau website Anda.
      </p>

      <hr />

      <h2>🔑 1. Cara Mendapatkan API Key</h2>
      <ol>
        <li>Buka halaman <a href="/daftar-reseller" className="text-blue-600 dark:text-blue-400 underline">Pendaftaran Reseller</a>.</li>
        <li>Isi formulir dengan email dan alasan bergabung.</li>
        <li>Tunggu persetujuan dari admin Exha Wave. Anda akan menerima notifikasi melalui email.</li>
        <li>Setelah disetujui, API Key akan muncul di halaman <strong>Dashboard Reseller</strong> (akan tersedia setelah login).</li>
        <li>Gunakan API Key tersebut pada setiap request dengan menyertakan header <code>x-api-key</code>.</li>
      </ol>

      <hr />

      <h2>🌐 2. Base URL</h2>
      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto"><code>https://exhawave.com/api/reseller</code></pre>

      <hr />

      <h2>📤 3. Format Request & Response</h2>
      <ul>
        <li>Semua request dan response menggunakan format <strong>JSON</strong>.</li>
        <li>Header yang wajib: <code>Content-Type: application/json</code> dan <code>x-api-key: YOUR_API_KEY</code>.</li>
        <li>Response sukses akan memiliki HTTP status <code>200</code> atau <code>201</code>.</li>
        <li>Response error akan memiliki HTTP status <code>400</code>, <code>401</code>, <code>404</code>, atau <code>429</code>.</li>
      </ul>

      <hr />

      <h2>📚 4. Daftar Endpoint</h2>

      <h3>4.1. Cek Produk / Layanan</h3>
      <p><strong>Endpoint:</strong> <code>GET /api/reseller/cek-produk</code></p>
      <p><strong>Deskripsi:</strong> Mengambil daftar semua layanan yang tersedia beserta harga dan ketentuan.</p>
      <p><strong>Contoh Request:</strong></p>
      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto"><code>{`fetch('https://exhawave.com/api/reseller/cek-produk', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'YOUR_API_KEY'
  }
})
.then(res => res.json())
.then(data => console.log(data))`}</code></pre>
      <p><strong>Contoh Response Sukses:</strong></p>
      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto"><code>{`{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "name": "Instagram Followers",
      "platform": "Instagram",
      "pricePerUnit": 1000,
      "minOrder": 100,
      "type": "REGULAR"
    },
    ...
  ]
}`}</code></pre>

      <h3>4.2. Buat Pesanan</h3>
      <p><strong>Endpoint:</strong> <code>POST /api/reseller/order</code></p>
      <p><strong>Deskripsi:</strong> Membuat pesanan baru. Saldo reseller akan otomatis terpotong sesuai total harga.</p>
      <p><strong>Body Request:</strong></p>
      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto"><code>{`{
  "serviceId": "clx...",
  "targetLink": "https://instagram.com/username",
  "quantity": 1000,
  "notes": "optional notes"
}`}</code></pre>
      <p><strong>Contoh Request:</strong></p>
      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto"><code>{`fetch('https://exhawave.com/api/reseller/order', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'YOUR_API_KEY'
  },
  body: JSON.stringify({
    serviceId: 'clx...',
    targetLink: 'https://instagram.com/username',
    quantity: 1000
  })
})
.then(res => res.json())
.then(data => console.log(data))`}</code></pre>
      <p><strong>Contoh Response Sukses:</strong></p>
      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto"><code>{`{
  "success": true,
  "orderId": "ExhaA1B2C3",
  "message": "Pesanan berhasil dibuat"
}`}</code></pre>

      <h3>4.3. Cek Status Pesanan</h3>
      <p><strong>Endpoint:</strong> <code>GET /api/reseller/cek-status?orderId=ExhaA1B2C3</code></p>
      <p><strong>Deskripsi:</strong> Mengecek status terkini dari sebuah pesanan.</p>
      <p><strong>Contoh Request:</strong></p>
      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto"><code>{`fetch('https://exhawave.com/api/reseller/cek-status?orderId=ExhaA1B2C3', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'YOUR_API_KEY'
  }
})
.then(res => res.json())
.then(data => console.log(data))`}</code></pre>
      <p><strong>Contoh Response Sukses:</strong></p>
      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto"><code>{`{
  "success": true,
  "order": {
    "id": "ExhaA1B2C3",
    "status": "PROCESSING",
    "serviceName": "Instagram Followers",
    "targetLink": "https://instagram.com/username",
    "quantity": 1000,
    "startCount": 0,
    "endCount": 500,
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}`}</code></pre>

      <hr />

      <h2>⚠️ 5. Kode Error</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 dark:border-gray-700">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="px-4 py-2 text-left">Kode</th>
              <th className="px-4 py-2 text-left">Pesan</th>
              <th className="px-4 py-2 text-left">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-2">400</td>
              <td className="px-4 py-2">Data tidak lengkap</td>
              <td className="px-4 py-2">Parameter wajib tidak diisi</td>
            </tr>
            <tr>
              <td className="px-4 py-2">401</td>
              <td className="px-4 py-2">API Key tidak valid</td>
              <td className="px-4 py-2">API Key salah atau tidak disertakan</td>
            </tr>
            <tr>
              <td className="px-4 py-2">404</td>
              <td className="px-4 py-2">Layanan tidak ditemukan</td>
              <td className="px-4 py-2">ID layanan tidak valid</td>
            </tr>
            <tr>
              <td className="px-4 py-2">429</td>
              <td className="px-4 py-2">Terlalu banyak permintaan</td>
              <td className="px-4 py-2">Rate limit tercapai, coba lagi nanti</td>
            </tr>
            <tr>
              <td className="px-4 py-2">500</td>
              <td className="px-4 py-2">Kesalahan server</td>
              <td className="px-4 py-2">Silakan hubungi admin</td>
            </tr>
          </tbody>
        </table>
      </div>

      <hr />

      <h2>💡 6. Tips & Batasan</h2>
      <ul>
        <li>Gunakan API Key dengan bijak, jangan dibagikan ke pihak lain.</li>
        <li>Rate limit: maksimal 30 request per menit per API Key.</li>
        <li>Simpan API Key di sisi server Anda, jangan di frontend publik.</li>
        <li>Pastikan saldo mencukupi sebelum membuat pesanan.</li>
        <li>Jika ada masalah, hubungi dukungan melalui Live Chat atau email ke <a href="mailto:exhagroup@gmail.com" className="text-blue-600 dark:text-blue-400 underline">exhagroup@gmail.com</a>.</li>
      </ul>

      <hr />

      <p className="text-sm text-gray-500 dark:text-gray-400">
        Terakhir diperbarui: 25 Juli 2026. Versi API v1.0
      </p>
    </div>
  )
}
