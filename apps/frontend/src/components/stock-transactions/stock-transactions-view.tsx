"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import {
  ArrowClockwise,
  CaretDown,
  Plus,
  Prohibit,
  X,
} from "@phosphor-icons/react";
import { apiGet, apiPost } from "@/lib/api";
import { formatDate, formatQty } from "@/lib/format";
import type {
  CreateStockTransactionInput,
  Product,
  StockTransaction,
  StockUnitType,
} from "@/lib/types";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Toast, type ToastState } from "@/components/ui/toast";

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

type StatusFilter = "ALL" | "ACTIVE" | "CANCELLED";

export function StockTransactionsView() {
  const [rows, setRows] = useState<StockTransaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [cancelTarget, setCancelTarget] = useState<StockTransaction | null>(
    null,
  );
  const [cancelling, setCancelling] = useState(false);

  const dialogTitleId = useId();
  const filterGroupId = useId();

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

  useEffect(() => {
    if (!panelOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) {
        setPanelOpen(false);
        setForm(emptyForm());
        setFormError(null);
        setAdvancedOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panelOpen, saving]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === form.productId) ?? null,
    [products, form.productId],
  );

  const filteredRows = useMemo(() => {
    if (statusFilter === "ALL") return rows;
    return rows.filter((row) => row.status === statusFilter);
  }, [rows, statusFilter]);

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
          ? `${formatQty(q)} ${selectedProduct.purchaseUnit} = ${formatQty(base)} ${selectedProduct.saleUnit}`
          : `${formatQty(q)} ${selectedProduct.saleUnit}`,
    };
  }, [form.quantity, form.unitType, selectedProduct]);

  function openCreate() {
    setForm({
      ...emptyForm(),
      productId: products[0]?.id ?? "",
    });
    setFormError(null);
    setAdvancedOpen(false);
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
    setForm(emptyForm());
    setFormError(null);
    setAdvancedOpen(false);
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
      setFormError("Jumlah harus lebih dari 0.");
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
      setToast({ message: "Transaksi stok berhasil dibuat.", tone: "success" });
      closePanel();
      await load();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Gagal membuat transaksi",
      );
    } finally {
      setSaving(false);
    }
  }

  async function confirmCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await apiPost<StockTransaction>(
        `/stock-transactions/${cancelTarget.id}/cancel`,
        {},
      );
      setToast({
        message: `Transaksi ${cancelTarget.sequenceNo} dibatalkan. Stok dikembalikan.`,
        tone: "success",
      });
      setCancelTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membatalkan");
      setCancelTarget(null);
    } finally {
      setCancelling(false);
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
            Penambahan stok dengan nomor transaksi otomatis. Pembatalan
            mengembalikan stok sesuai konversi satuan.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-[var(--radius-app)] border border-border bg-surface px-3 py-2 text-sm font-medium hover:bg-surface-muted active:scale-[0.98]"
          >
            <ArrowClockwise size={16} />
            Muat ulang
          </button>
          <button
            type="button"
            onClick={openCreate}
            disabled={products.length === 0}
            title={
              products.length === 0
                ? "Buat master barang terlebih dulu"
                : undefined
            }
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
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="radiogroup"
            aria-labelledby={filterGroupId}
            className="flex flex-wrap gap-1.5"
          >
            <span id={filterGroupId} className="sr-only">
              Filter status transaksi
            </span>
            {(
              [
                { value: "ALL", label: "Semua" },
                { value: "ACTIVE", label: "Aktif" },
                { value: "CANCELLED", label: "Dibatalkan" },
              ] as const
            ).map((opt) => {
              const active = statusFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setStatusFilter(opt.value)}
                  className={[
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-colors active:scale-[0.98]",
                    active
                      ? "bg-accent text-white dark:text-zinc-950"
                      : "bg-surface-muted text-muted hover:text-foreground",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted">
            Menampilkan {filteredRows.length} dari {rows.length} transaksi
          </p>
        </div>

        {error ? (
          <div className="m-4 flex flex-col gap-2 rounded-[var(--radius-app)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void load()}
              className="shrink-0 rounded-lg border border-danger/30 px-3 py-1.5 text-xs font-semibold hover:bg-surface"
            >
              Coba lagi
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-[var(--radius-app)] bg-surface-muted motion-reduce:animate-none"
              />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <p className="font-medium">Belum ada transaksi stok</p>
            <p className="max-w-sm text-sm text-muted">
              Catat penambahan stok (grosir atau eceran). Nomor transaksi dibuat
              otomatis dari tanggal.
            </p>
            {products.length > 0 ? (
              <button
                type="button"
                onClick={openCreate}
                className="mt-1 inline-flex items-center gap-2 rounded-[var(--radius-app)] bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover dark:text-zinc-950"
              >
                <Plus size={16} weight="bold" />
                Tambah stok
              </button>
            ) : null}
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-medium">Tidak ada transaksi di filter ini</p>
            <p className="mt-1 text-sm text-muted">
              Coba pilih filter status lain.
            </p>
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className="mt-3 rounded-[var(--radius-app)] border border-border px-3 py-1.5 text-sm font-medium hover:bg-surface-muted"
            >
              Tampilkan semua
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface-muted/70 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">No. transaksi</th>
                  <th className="px-4 py-3 font-medium">Tanggal</th>
                  <th className="px-4 py-3 font-medium">Barang</th>
                  <th className="px-4 py-3 font-medium">Jumlah</th>
                  <th className="px-4 py-3 font-medium">Stok (+)</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-border hover:bg-surface-muted/40"
                  >
                    <td className="px-4 py-3 font-mono text-xs">
                      {row.sequenceNo}
                    </td>
                    <td className="px-4 py-3">{formatDate(row.date)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        {row.product?.name ?? row.productId}
                      </p>
                      <p className="font-mono text-xs text-muted">
                        {row.product?.sku}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono">
                        {formatQty(row.quantity)}
                      </span>{" "}
                      <span className="text-muted">
                        {row.unitType === "PURCHASE"
                          ? row.product?.purchaseUnit
                          : row.product?.saleUnit}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {formatQty(row.baseQty)}{" "}
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
                          onClick={() => setCancelTarget(row)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-danger hover:bg-danger-soft active:scale-[0.98]"
                        >
                          <Prohibit size={14} />
                          Batalkan
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
            onClick={() => {
              if (!saving) closePanel();
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            className="relative z-10 w-full max-w-lg rounded-t-[var(--radius-app)] border border-border bg-surface p-5 shadow-xl sm:rounded-[var(--radius-app)] sm:p-6"
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 id={dialogTitleId} className="text-lg font-semibold">
                  Tambah stok
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Nomor transaksi dibuat otomatis dari tanggal. Bisa diganti
                  manual di opsi lanjutan.
                </p>
              </div>
              <button
                type="button"
                aria-label="Tutup"
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
                      {p.name} ({p.sku}) — stok {formatQty(p.stockQty)}{" "}
                      {p.saleUnit}
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

              <fieldset className="rounded-[var(--radius-app)] border border-border p-3">
                <legend className="px-1 text-sm font-medium">
                  Jumlah stok
                </legend>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-2">
                    <span className="text-xs text-muted">Jumlah</span>
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
                    <span className="text-xs text-muted">Satuan input</span>
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
                        {selectedProduct
                          ? ` (${selectedProduct.saleUnit})`
                          : ""}
                      </option>
                    </select>
                  </label>
                </div>
              </fieldset>

              {previewBase ? (
                <p className="rounded-[var(--radius-app)] border border-border bg-accent-soft px-3 py-2 text-sm text-accent">
                  Stok akan bertambah:{" "}
                  <strong className="font-mono">
                    {formatQty(previewBase.base)}
                  </strong>{" "}
                  {previewBase.unit}
                  <span className="mt-0.5 block text-xs opacity-90">
                    {previewBase.label}
                  </span>
                </p>
              ) : null}

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

              <div className="rounded-[var(--radius-app)] border border-border">
                <button
                  type="button"
                  onClick={() => setAdvancedOpen((v) => !v)}
                  aria-expanded={advancedOpen}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium hover:bg-surface-muted"
                >
                  Opsi lanjutan
                  <CaretDown
                    size={16}
                    className={[
                      "text-muted transition-transform",
                      advancedOpen ? "rotate-180" : "",
                    ].join(" ")}
                  />
                </button>
                {advancedOpen ? (
                  <div className="border-t border-border px-3 py-3">
                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-medium">
                        Nomor transaksi manual
                      </span>
                      <input
                        value={form.sequenceNo}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            sequenceNo: e.target.value,
                          }))
                        }
                        placeholder="Kosongkan = otomatis STK/Hari/Bulan/Tahun/00001"
                        className="rounded-[var(--radius-app)] border border-border bg-background px-3 py-2.5 font-mono text-sm outline-none focus:ring-2 focus:ring-accent"
                      />
                      <span className="text-xs text-muted">
                        Hanya diisi jika perlu nomor khusus. Harus unik.
                      </span>
                    </label>
                  </div>
                ) : null}
              </div>

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

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Batalkan transaksi?"
        description={
          cancelTarget
            ? `Batalkan ${cancelTarget.sequenceNo}? Stok akan dikurangi ${formatQty(cancelTarget.baseQty)} ${cancelTarget.product?.saleUnit ?? "unit base"} (dikembalikan ke posisi sebelum penambahan).`
            : ""
        }
        confirmLabel="Ya, batalkan"
        cancelLabel="Kembali"
        danger
        busy={cancelling}
        onConfirm={() => void confirmCancel()}
        onCancel={() => {
          if (!cancelling) setCancelTarget(null);
        }}
      />

      <Toast toast={toast} onDismiss={() => setToast(null)} />
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
      {active ? "Aktif" : "Dibatalkan"}
    </span>
  );
}
