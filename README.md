# Stock Transaction Module — PT Multi Power Aditama

Technical case (Full Stack Developer): modul **Stock Transaction** untuk skenario manajemen stok dengan konversi satuan, sequence nomor transaksi, dan concurrent-safe generation.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js (App Router) |
| Backend | NestJS |
| Database | PostgreSQL |

## Repository Structure

```text
studycasempa/
├── apps/
│   ├── frontend/     # Next.js
│   └── backend/      # NestJS
├── package.json      # root scripts (dev both apps)
└── README.md
```

## Prerequisites

- Node.js 20+ (disarankan LTS)
- npm
- PostgreSQL

## Getting Started

### 1. Install dependencies

```bash
# root (concurrently + scripts monorepo)
npm install

# frontend
cd apps/frontend
npm install

# backend
cd ../backend
npm install
```

### 2. Run development servers

Dari **root** monorepo:

```bash
npm run dev
```

Script ini menjalankan:

- Backend NestJS → biasanya `http://localhost:3000` (default Nest)
- Frontend Next.js → biasanya `http://localhost:3000` **atau** port Next default

> **Catatan:** default Nest dan Next sama-sama sering memakai port `3000`. Saat integrasi API, backend akan diarahkan ke port lain (mis. `3001`) agar tidak bentrok. Untuk sekarang, jalankan terpisah jika port conflict:

```bash
# terminal 1 — backend
npm run dev:backend

# terminal 2 — frontend
npm run dev:frontend
```

Atau dari masing-masing app:

```bash
# apps/backend
npm run start:dev

# apps/frontend
npm run dev
```

## Scripts (root)

| Command | Description |
| --- | --- |
| `npm run dev` | Jalankan frontend + backend bersamaan |
| `npm run dev:frontend` | Next.js dev server saja |
| `npm run dev:backend` | NestJS watch mode saja |

## Scope (ringkas)

1. **Master Barang** — nama, SKU, satuan pembelian/penjualan, konversi satuan  
2. **Transaksi stok** — penambahan stok, pembatalan (cancel) dengan rollback quantity  
3. **Sequence** — auto `STK/<Hari>/<Bulan Romawi>/<Tahun>/<Running Number>`, manual unique, concurrent-safe  
