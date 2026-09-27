# ZEKAIS Cloudflare Edition

Frontend static yang siap di-deploy ke Cloudflare Pages.

## Deploy cepat

1. Buka Cloudflare Dashboard → Workers & Pages → Create application → Pages.
2. Pilih upload assets / Direct Upload.
3. Upload folder `public`.
4. Atau gunakan Git dan set build command kosong, output directory `public`.

## Local

Bisa dibuka langsung dari `public/index.html`, atau gunakan server static lokal.

## Catatan

Data pada dashboard, monitor, dan direktori adalah data demo.
Untuk produksi, sambungkan:
- Cloudflare Workers untuk API
- D1 untuk data relasional
- KV untuk cache/config
- R2 untuk file
- Durable Objects/WebSocket bila butuh realtime

Project ini membuat ulang pola UI dan alur frontend, bukan menyalin backend Zekais asli.
