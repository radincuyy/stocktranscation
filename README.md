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
├── .github/
│   └── workflows/
│       └── ci.yml                 # CI: backend test+build, frontend build
├── apps/
│   ├── backend/                   # NestJS + Prisma
│   │   ├── prisma/
│   │   │   ├── migrations/        # SQL migrations
│   │   │   ├── schema.prisma      # model Product, StockTransaction, SequenceCounter
│   │   │   └── seed.ts            # data contoh Minyak (MYK-100)
│   │   ├── src/
│   │   │   ├── common/            # filter error, interceptor response, validators
│   │   │   ├── prisma/            # PrismaModule / PrismaService
│   │   │   ├── products/          # CRUD master barang
│   │   │   ├── sequence/          # generate sequence + FOR UPDATE lock
│   │   │   ├── stock-transactions/# penambahan stok + cancel
│   │   │   ├── app.module.ts
│   │   │   ├── app.controller.ts  # GET /api/health
│   │   │   └── main.ts
│   │   ├── test/                  # e2e health
│   │   ├── package.json
│   │   └── prisma.config.ts
│   └── frontend/                  # Next.js (App Router)
│       ├── public/
│       ├── src/
│       │   ├── app/               # routes: /, /products, /stock-transactions
│       │   ├── components/        # app-shell, products-view, stock-transactions-view
│       │   └── lib/               # api client, types, format angka
│       ├── package.json
│       └── next.config.ts
├── docker-compose.yml             # PostgreSQL 16
├── ERD.png                        # entity relationship diagram
├── package.json                   # script monorepo (dev, db:*, seed)
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

### Langkah 4b — Seed data contoh (opsional)

```bash
npm run db:seed
```

Mengisi master **Minyak / MYK-100** (1 Drum = 200 Liter) plus 1 transaksi seed (+1 Drum → stok 200 Liter).

### Langkah 5 — Jalankan aplikasi

Semua opsi di bawah dijalankan **setelah** database sudah up + migrate (langkah 3–4).

#### Opsi A — Frontend + backend sekaligus (dari root)

```bash
# pastikan kamu di folder root: studycasempa/
npm run dev
```

Satu terminal, dua service jalan bareng.

#### Opsi B — Masing-masing terpisah (tetap dari root)

Buka **2 terminal**, keduanya di folder root:

```bash
# Terminal 1 — backend saja (NestJS → port 3001)
npm run dev:backend

# Terminal 2 — frontend saja (Next.js → port 3000)
npm run dev:frontend
```

Cocok kalau mau log backend dan frontend terpisah, atau cuma ngerjain salah satu sisi.

#### Opsi C — Langsung dari folder app

```bash
# Terminal 1
cd apps/backend
npm run start:dev

# Terminal 2
cd apps/frontend
npm run dev
```

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

### Dari root (`studycasempa/`)

| Perintah | Fungsi |
| --- | --- |
| `npm run db:up` | Start PostgreSQL (Docker) |
| `npm run db:down` | Stop PostgreSQL |
| `npm run db:migrate` | Apply migration Prisma |
| `npm run db:studio` | Buka Prisma Studio (lihat data di browser) |
| `npm run db:seed` | Isi data contoh Minyak (case) |
| `npm run dev` | Frontend **+** backend bersamaan |
| `npm run dev:frontend` | Frontend saja (Next.js) |
| `npm run dev:backend` | Backend saja (NestJS) |

### Dari folder app

| Lokasi | Perintah | Fungsi |
| --- | --- | --- |
| `apps/backend` | `npm run start:dev` | Backend watch mode |
| `apps/frontend` | `npm run dev` | Frontend dev server |

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

## Cara pakai singkat

1. Buka http://localhost:3000/products → buat/master barang (atau `npm run db:seed`)  
2. Buka http://localhost:3000/stock-transactions → **Tambah stok** (grosir/eceran)  
3. Cek stok di Master Barang naik sesuai konversi  
4. **Cancel** transaksi → stok dikembalikan  

ERD: lihat [`ERD.png`](./ERD.png).

## Sequence & concurrency

- **Auto:** nomor di-generate dari tanggal transaksi + counter per `Hari-BulanRomawi-Tahun`.  
- **Manual:** isi field sequence (opsional); ditolak jika sudah dipakai (HTTP 409).  
- **Concurrent:** counter di-lock dengan `SELECT ... FOR UPDATE` di dalam transaksi DB.

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
