# Stock Transaction Module — PT Multi Power Aditama

Technical case (Full Stack Developer): modul **Stock Transaction** untuk manajemen stok dengan konversi satuan, penambahan/pembatalan stok, dan nomor transaksi (sequence) yang aman saat multi-user.

## Tech Stack

| Layer | Technology | URL (dev) |
| --- | --- | --- |
| Frontend | Next.js (App Router) | http://localhost:3000 |
| Backend | NestJS | http://localhost:3001/api |
| Database | PostgreSQL 16 (Docker) | `localhost:5432` |
| ORM | Prisma | — |

## Struktur Project

```text
studycasempa/
├── apps/
│   ├── frontend/          # Next.js
│   └── backend/           # NestJS + Prisma
│       └── prisma/        # schema & migrations
├── docker-compose.yml     # PostgreSQL
├── package.json           # script monorepo
└── README.md
```

## Prerequisites

Pastikan sudah terpasang:

1. **Node.js 20+** — cek: `node -v`
2. **npm** — cek: `npm -v`
3. **Docker Desktop** — harus **running** sebelum start database

---

## Cara Menjalankan

Jalankan semua perintah dari folder root project: `studycasempa/`.

### Langkah 1 — Install dependency

```bash
npm install
npm --prefix apps/backend install
npm --prefix apps/frontend install
```

### Langkah 2 — Siapkan file environment

Salin file contoh (hanya sekali, atau jika file `.env` belum ada):

**Windows (PowerShell / CMD):**

```bash
copy apps\backend\.env.example apps\backend\.env
copy apps\frontend\.env.example apps\frontend\.env.local
```

**macOS / Linux:**

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env.local
```

Isi default sudah cocok dengan `docker-compose.yml`. Tidak perlu diubah untuk development lokal.

### Langkah 3 — Nyalakan database

1. Buka **Docker Desktop** dan pastikan statusnya running.
2. Di root project:

```bash
npm run db:up
```

Tunggu beberapa detik sampai container PostgreSQL ready.

### Langkah 4 — Jalankan migrasi database

```bash
npm run db:migrate
```

Ini membuat tabel di PostgreSQL sesuai schema Prisma.

> Jika diminta nama migration dan database sudah pernah di-migrate, cukup Enter / lewati.

### Langkah 5 — Jalankan aplikasi

```bash
npm run dev
```

Script ini menjalankan **backend + frontend** bersamaan.

### Langkah 6 — Cek apakah sudah jalan

| Cek | Alamat |
| --- | --- |
| Frontend | http://localhost:3000 |
| Backend health | http://localhost:3001/api/health |

Contoh cek backend (PowerShell):

```powershell
Invoke-RestMethod http://localhost:3001/api/health
```

Respons sukses kurang lebih:

```json
{
  "success": true,
  "message": "Service healthy",
  "data": {
    "status": "ok",
    "database": "up"
  }
}
```

---

## Ringkasan perintah

| Perintah | Fungsi |
| --- | --- |
| `npm run db:up` | Start PostgreSQL (Docker) |
| `npm run db:down` | Stop PostgreSQL |
| `npm run db:migrate` | Apply migration Prisma |
| `npm run db:studio` | Buka Prisma Studio (lihat data di browser) |
| `npm run dev` | Jalankan frontend + backend |
| `npm run dev:frontend` | Frontend saja |
| `npm run dev:backend` | Backend saja |

---

## Port yang dipakai

| Service | Port |
| --- | --- |
| Frontend (Next.js) | `3000` |
| Backend (NestJS) | `3001` |
| PostgreSQL | `5432` |

Frontend memanggil API lewat: `http://localhost:3001/api`  
(atur di `apps/frontend/.env.local` → `NEXT_PUBLIC_API_URL`)

---

## Scope fitur (case)

1. **Master Barang** — nama, SKU, satuan pembelian, satuan penjualan, konversi satuan  
2. **Transaksi stok** — penambahan stok; cancel mengembalikan stok dengan konversi yang benar  
3. **Sequence** — format `STK/<Nama Hari>/<Bulan Romawi>/<Tahun>/<Running Number>` (auto, manual unique, concurrent-safe)

Contoh sequence: `STK/Senin/VII/2026/00001`

---

## Troubleshooting

| Masalah | Solusi |
| --- | --- |
| `db:up` gagal / Docker error | Pastikan **Docker Desktop** sudah dibuka dan running |
| Port `5432` sudah dipakai | Stop service PostgreSQL lokal lain, atau ubah port di `docker-compose.yml` |
| Backend error `DATABASE_URL` | Pastikan `apps/backend/.env` ada (salin dari `.env.example`) |
| Health `database` tidak `up` | Jalankan ulang `npm run db:up`, lalu `npm run db:migrate` |
| Frontend tidak connect API | Cek backend di port `3001` dan isi `NEXT_PUBLIC_API_URL` di `.env.local` |
| Port `3000` / `3001` bentrok | Matikan proses yang memakai port itu, atau ubah `PORT` di backend `.env` |

---
