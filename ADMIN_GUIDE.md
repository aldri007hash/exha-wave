# Panduan Admin Exha Wave

## Promo
- **Diskon Tanggal**: Diskon untuk topup saldo. Isi diskon (%) dan minimal topup.
- **Jam Sibuk**: Diskon untuk pembelian layanan. Isi diskon (%) dan jam berlaku (0-23).
- **Penting**: Isi tanggal mulai & berakhir dengan benar. Promo akan muncul otomatis di halaman depan.

## Pesanan
- Ubah status ke COMPLETED/PARTIAL/CANCELLED wajib mengisi alasan.
- Upload file opsional.
- Start Count / End Count bisa diisi untuk progress bar.

## Layanan
- Tipe SINGLE: layanan biasa.
- Tipe BUNDLE: paket hemat, isi daftar layanan dan harga paket.
- Garansi: pilih "Bergaransi" jika layanan bisa diklaim garansi.

## Backup & Maintenance
- Backup database: Neon.tech otomatis backup harian.
- Backup file: Jalankan `tar -czvf exha-backup.tar.gz /root/exha-wave`.
- Restart server: `pm2 restart exha-wave`.
- Lihat log error: `pm2 logs exha-wave --lines 20`.

## Monitoring
- Gunakan UptimeRobot untuk memantau apakah website hidup.
- Cek penggunaan CPU & RAM: `htop`.
- Cek kapasitas disk: `df -h`.

## Penting
- Pastikan MIDTRANS_IS_PRODUCTION=true setelah ACC.
- Pastikan GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET benar.
- Jangan bagikan file .env ke siapapun.
