# OrderKuota Proxy API

Proxy Gateway untuk pembayaran QRIS OrderKuota dengan fitur unique amount dan tracking pembayaran.

## Base URL

```
https://orkut.sebelasindonesia.app
```

## Tools

Dapatkan Token & QRIS Static dengan mudah: [https://orkut.sebelasindonesia.app/tools.html](https://orkuts.sebelasindonesia.app/tools.html)

## Fitur

- Konversi QRIS statis ke QRIS dinamis dengan nominal tertentu
- Unique amount suffix (1-999) untuk mencegah collision pembayaran
- Cek status pembayaran (pending/paid/expired)
- Auto-cleanup transaksi expired
- Cek saldo akun
- Generate gambar QR code
- Autentikasi OTP

## API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/auth/otp` | Request OTP |
| POST | `/api/auth/token` | Dapatkan token |
| POST | `/api/qris/generate` | Generate QRIS dinamis dari QRIS statis |
| POST | `/api/qris/check` | Cek status pembayaran |
| POST | `/api/qris/image` | Generate gambar QR code |
| POST | `/api/account/balance` | Cek saldo |
| GET | `/api/health` | Health check |

## Cara Penggunaan

### 1. Dapatkan Token & QRIS Static

Gunakan [halaman Tools](https://orkut.sebelasindonesia.app/tools.html) atau:

```bash
# Request OTP
curl -X POST https://orkut.sebelasindonesia.app/api/auth/otp \
  -H "Content-Type: application/json" \
  -d '{"username":"OK123456","password":"yourpassword"}'

# Dapatkan Token dengan OTP
curl -X POST https://orkut.sebelasindonesia.app/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"username":"OK123456","otp":"123456"}'
```

### 2. Generate Pembayaran QRIS

```bash
curl -X POST https://orkut.sebelasindonesia.app/api/qris/generate \
  -H "Content-Type: application/json" \
  -d '{
    "username": "OK123456",
    "token": "123456:abcdef...",
    "amount": 10000,
    "qris_static": "00020101021126670016COM.NOBUBANK.WWW..."
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "transaction_id": "uuid-here",
    "base_amount": 10000,
    "unique_suffix": 1,
    "final_amount": 10001,
    "qris_string": "00020101021226...",
    "expires_at": 1234567890
  }
}
```

### 3. Generate Gambar QR

```bash
curl -X POST https://orkut.sebelasindonesia.app/api/qris/image \
  -H "Content-Type: application/json" \
  -d '{"qris_string":"00020101021226...","size":300}'
```

### 4. Cek Status Pembayaran

```bash
curl -X POST https://orkut.sebelasindonesia.app/api/qris/check \
  -H "Content-Type: application/json" \
  -d '{
    "username": "OK123456",
    "token": "123456:abcdef...",
    "transaction_id": "uuid-here"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "status": "paid",
    "final_amount": 10001,
    "paid_at": 1234567890
  }
}
```

## Cara Mendapatkan QRIS Static

1. Gunakan [halaman Tools](https://orkut.sebelasindonesia.app/tools.html) (direkomendasikan)
2. Atau scan gambar QRIS di [imagetotext.info/qr-code-scanner](https://www.imagetotext.info/qr-code-scanner)

## Catatan

- QRIS expired dalam 10 menit
- Range unique suffix: 1-999 (prioritas 1-500)
- Transaksi paid disimpan 1 jam untuk re-verifikasi
- Semua credentials hanya diteruskan, tidak disimpan

## Self-Hosting

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Database Turso

1. Buat akun di [turso.tech](https://turso.tech)
2. Buat database
3. Dapatkan database URL dan auth token

### 3. Environment Variables

```env
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-auth-token
```

### 4. Deploy ke Vercel

```bash
npm run deploy
```

## Lisensi

MIT
