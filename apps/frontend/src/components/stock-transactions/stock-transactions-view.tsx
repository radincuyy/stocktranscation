"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowClockwise,
  Plus,
  Prohibit,
  X,
} from "@phosphor-icons/react";
import { apiGet, apiPost } from "@/lib/api";
import type {
  CreateStockTransactionInput,
  Product,
  StockTransaction,
  StockUnitType,
} from "@/lib/types";

type FormState = {
  productId: string;
  date: string;
  quantity: string;
  unitType: StockUnitType;
  note: string;
  sequenceNo: string;
};

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const emptyForm = (): FormState => ({
  productId: "",
  date: todayIso(),
  quantity: "",
  unitType: "PURCHASE",
  note: "",
  sequenceNo: "",
});

export function StockTransactionsView() {
  const [rows, setRows] = useState<StockTransaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [txRes, prodRes] = await Promise.all([
        apiGet<StockTransaction[]>("/stock-transactions"),
        apiGet<Product[]>("/products"),
      ]);
      setRows(txRes.data);
      setProducts(prodRes.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === form.productId) ?? null,
    [products, form.productId],
  );

  const previewBase = useMemo(() => {
    const q = Number(form.quantity);
    if (!selectedProduct || !Number.isFinite(q) || q <= 0) return null;
    const rate = Number(selectedProduct.conversionRate);
    const base = form.unitType === "PURCHASE" ? q * rate : q;
    return {
      base,
      unit: selectedProduct.saleUnit,
      label:
        form.unitType === "PURCHASE"
          ? `${q} ${selectedProduct.purchaseUnit} = ${base} ${selectedProduct.saleUnit}`
          : `${q} ${selectedProduct.saleUnit}`,
    };
  }, [form.quantity, form.unitType, selectedProduct]);

  function openCreate() {
    setForm({
      ...emptyForm(),
      productId: products[0]?.id ?? "",
    });
    setFormError(null);
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
    setForm(emptyForm());
    setFormError(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const quantity = Number(form.quantity);
    if (!form.productId) {
      setFormError("Pilih barang.");
      return;
    }
    if (!form.date) {
      setFormError("Tanggal wajib diisi.");
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setFormError("Quantity harus lebih dari 0.");
      return;
    }

    const payload: CreateStockTransactionInput = {
      productId: form.productId,
      date: form.date,
      quantity,
      unitType: form.unitType,
      note: form.note.trim() || undefined,
      sequenceNo: form.sequenceNo.trim() || undefined,
    };

    setSaving(true);
    try {
      await apiPost<StockTransaction>("/stock-transactions", payload);
      closePanel();
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal membuat transaksi");
    } finally {
      setSaving(false);
    }
  }

  async function onCancel(row: StockTransaction) {
    if (row.status === "CANCELLED") return;
    const ok = window.confirm(
      `Batalkan transaksi ${row.sequenceNo}? Stok akan dikembalikan ${row.baseQty} ${row.product?.saleUnit ?? "unit base"}.`,
    );
    if (!ok) return;
    try {
      await apiPost<StockTransaction>(
        `/stock-transactions/${row.id}/cancel`,
        {},
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membatalkan");
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Transaksi Stok
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted">
            Penambahan stok dengan sequence otomatis. Cancel mengembalikan stok
            sesuai konversi satuan.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-[var(--radius-app)] border border-border bg-surface px-3 py-2 text-sm font-medium hover:bg-surface-muted active:scale-[0.98]"
          >
            <ArrowClockwise size={16} />
            Refresh
          </button>
          <button
            type="button"
            onClick={openCreate}
            disabled={products.length === 0}
            className="inline-flex items-center gap-2 rounded-[var(--radius-app)] bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50 dark:text-zinc-950 active:scale-[0.98]"
          >
            <Plus size={16} weight="bold" />
            Tambah stok
          </button>
        </div>
      </div>

      {products.length === 0 && !loading ? (
        <div className="rounded-[var(--radius-app)] border border-warning/40 bg-warning-soft px-4 py-3 text-sm text-warning">
          Belum ada master barang. Buat di menu Master Barang dulu (contoh
          Minyak / Drum / Liter / konversi 200).
        </div>
      ) : null}

      <div className="rounded-[var(--radius-app)] border border-border bg-surface">
        {error ? (
          <div className="m-4 rounded-[var(--radius-app)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-[var(--radius-app)] bg-surface-muted"
              />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-medium">Belum ada transaksi stok</p>
            <p className="mt-1 text-sm text-muted">
              Catat penambahan stok (grosir atau eceran). Sequence dibuat
              otomatis.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface-muted/70 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Sequence</th>
                  <th className="px-4 py-3 font-medium">Tanggal</th>
                  <th className="px-4 py-3 font-medium">Barang</th>
                  <th className="px-4 py-3 font-medium">Qty</th>
                  <th className="px-4 py-3 font-medium">Stok +</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-border hover:bg-surface-muted/40"
                  >
                    <td className="px-4 py-3 font-mono text-xs">
                      {row.sequenceNo}
                    </td>
                    <td className="px-4 py-3">{row.date}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        {row.product?.name ?? row.productId}
                      </p>
                      <p className="font-mono text-xs text-muted">
                        {row.product?.sku}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {row.quantity}{" "}
                      <span className="text-muted">
                        {row.unitType === "PURCHASE"
                          ? row.product?.purchaseUnit
                          : row.product?.saleUnit}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {row.baseQty}{" "}
                      <span className="font-sans text-muted">
                        {row.product?.saleUnit}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.status === "ACTIVE" ? (
                        <button
                          type="button"
                          onClick={() => void onCancel(row)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-danger hover:bg-danger-soft active:scale-[0.98]"
                        >
                          <Prohibit size={14} />
                          Cancel
                        </button>
                      ) : (
                        <span className="text-xs text-muted">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {panelOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Tutup"
            className="absolute inset-0"
            onClick={closePanel}
          />
          <div className="relative z-10 w-full max-w-lg rounded-t-[var(--radius-app)] border border-border bg-surface p-5 shadow-xl sm:rounded-[var(--radius-app)] sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Tambah stok</h2>
                <p className="mt-1 text-sm text-muted">
                  Sequence otomatis dari tanggal. Opsional: isi manual jika
                  unik.
                </p>
              </div>
              <button
                type="button"
                onClick={closePanel}
                className="rounded-lg p-1.5 text-muted hover:bg-surface-muted"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium">Barang</span>
                <select
                  value={form.productId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, productId: e.target.value }))
                  }
                  required
                  className="rounded-[var(--radius-app)] border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="" disabled>
                    Pilih barang
                  </option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) - stok {p.stockQty} {p.saleUnit}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium">Tanggal</span>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                  required
                  className="rounded-[var(--radius-app)] border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Quantity</span>
                  <input
                    value={form.quantity}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, quantity: e.target.value }))
                    }
                    placeholder="1"
                    inputMode="decimal"
                    required
                    className="rounded-[var(--radius-app)] border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Satuan input</span>
                  <select
                    value={form.unitType}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        unitType: e.target.value as StockUnitType,
                      }))
                    }
                    className="rounded-[var(--radius-app)] border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="PURCHASE">
                      Grosir
                      {selectedProduct
                        ? ` (${selectedProduct.purchaseUnit})`
                        : ""}
                    </option>
                    <option value="SALE">
                      Eceran
                      {selectedProduct ? ` (${selectedProduct.saleUnit})` : ""}
                    </option>
                  </select>
                </label>
              </div>

              {previewBase ? (
                <p className="rounded-[var(--radius-app)] border border-border bg-accent-soft px-3 py-2 text-sm text-accent">
                  Stok akan bertambah:{" "}
                  <strong className="font-mono">{previewBase.base}</strong>{" "}
                  {previewBase.unit}
                  <span className="mt-0.5 block text-xs opacity-90">
                    {previewBase.label}
                  </span>
                </p>
              ) : null}

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium">
                  Sequence manual (opsional)
                </span>
                <input
                  value={form.sequenceNo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sequenceNo: e.target.value }))
                  }
                  placeholder="Kosongkan = auto STK/Hari/Bulan/Tahun/00001"
                  className="rounded-[var(--radius-app)] border border-border bg-background px-3 py-2.5 font-mono text-sm outline-none focus:ring-2 focus:ring-accent"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium">Keterangan</span>
                <input
                  value={form.note}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, note: e.target.value }))
                  }
                  placeholder="Opsional"
                  className="rounded-[var(--radius-app)] border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent"
                />
              </label>

              {formError ? (
                <p className="rounded-[var(--radius-app)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
                  {formError}
                </p>
              ) : null}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closePanel}
                  className="rounded-[var(--radius-app)] border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-[var(--radius-app)] bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60 dark:text-zinc-950"
                >
                  {saving ? "Menyimpan..." : "Buat transaksi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const active = status === "ACTIVE";
  return (
    <span
      className={[
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        active
          ? "bg-accent-soft text-accent"
          : "bg-surface-muted text-muted",
      ].join(" ")}
    >
      {active ? "ACTIVE" : "CANCELLED"}
    </span>
  );
}
