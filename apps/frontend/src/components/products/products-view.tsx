"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowClockwise,
  MagnifyingGlass,
  Package,
  PencilSimple,
  Plus,
  Trash,
  X,
} from "@phosphor-icons/react";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { formatQty } from "@/lib/format";
import type { CreateProductInput, Product } from "@/lib/types";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Toast, type ToastState } from "@/components/ui/toast";

type FormState = {
  name: string;
  sku: string;
  purchaseUnit: string;
  saleUnit: string;
  conversionRate: string;
};

const emptyForm: FormState = {
  name: "",
  sku: "",
  purchaseUnit: "",
  saleUnit: "",
  conversionRate: "",
};

export function ProductsView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [toast, setToast] = useState<ToastState>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const dialogTitleId = useId();
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<Product[]>("/products");
      setProducts(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat produk");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!panelOpen) return;
    firstFieldRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) closePanel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panelOpen, saving]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.purchaseUnit.toLowerCase().includes(q) ||
        p.saleUnit.toLowerCase().includes(q),
    );
  }, [products, query]);

  const zeroStockCount = useMemo(
    () => products.filter((p) => Number(p.stockQty) === 0).length,
    [products],
  );

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setPanelOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name,
      sku: product.sku,
      purchaseUnit: product.purchaseUnit,
      saleUnit: product.saleUnit,
      conversionRate: product.conversionRate,
    });
    setFormError(null);
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
  }

  function isUnitName(value: string): boolean {
    const v = value.trim();
    if (!v) return false;
    if (!/[A-Za-z\u00C0-\u024F]/.test(v)) return false;
    if (/^\d+([.,]\d+)?$/.test(v)) return false;
    return true;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const conversionRate = Number(form.conversionRate);
    if (!form.name.trim() || !form.sku.trim()) {
      setFormError("Nama dan SKU wajib diisi.");
      return;
    }
    if (!isUnitName(form.purchaseUnit) || !isUnitName(form.saleUnit)) {
      setFormError(
        "Satuan harus nama unit (contoh: Drum, Liter), bukan angka. Angka konversi diisi di field terpisah.",
      );
      return;
    }
    if (!Number.isFinite(conversionRate) || conversionRate <= 0) {
      setFormError("Konversi satuan harus angka lebih dari 0.");
      return;
    }

    const payload: CreateProductInput = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      purchaseUnit: form.purchaseUnit.trim(),
      saleUnit: form.saleUnit.trim(),
      conversionRate,
    };

    setSaving(true);
    try {
      if (editing) {
        await apiPatch<Product>(`/products/${editing.id}`, payload);
        setToast({ message: "Barang berhasil diperbarui.", tone: "success" });
      } else {
        await apiPost<Product>("/products", payload);
        setToast({ message: "Barang berhasil ditambahkan.", tone: "success" });
      }
      closePanel();
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiDelete<Product>(`/products/${deleteTarget.id}`);
      setToast({
        message: `"${deleteTarget.name}" dihapus.`,
        tone: "success",
      });
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const conversionHint =
    form.conversionRate &&
    form.purchaseUnit &&
    form.saleUnit &&
    Number(form.conversionRate) > 0
      ? `1 ${form.purchaseUnit} = ${form.conversionRate} ${form.saleUnit}`
      : "Contoh: 1 Drum = 200 Liter";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Master Barang
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted">
            Kelola SKU, satuan grosir/eceran, dan rumus konversi stok desimal.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-[var(--radius-app)] border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted active:scale-[0.98]"
          >
            <ArrowClockwise size={16} />
            Muat ulang
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-[var(--radius-app)] bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover active:scale-[0.98] dark:text-zinc-950"
          >
            <Plus size={16} weight="bold" />
            Tambah barang
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard
          label="Total SKU"
          value={loading ? "-" : String(products.length)}
        />
        <StatCard
          label="SKU stok kosong"
          value={loading ? "-" : String(zeroStockCount)}
        />
      </div>

      <div className="rounded-[var(--radius-app)] border border-border bg-surface">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <MagnifyingGlass
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama, SKU, atau satuan"
              aria-label="Cari barang"
              className="w-full rounded-[var(--radius-app)] border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none ring-accent focus:ring-2"
            />
          </div>
          <p className="text-xs text-muted">
            Stok disimpan dalam satuan penjualan (base unit)
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
                className="h-16 animate-pulse rounded-[var(--radius-app)] bg-surface-muted motion-reduce:animate-none"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Package size={22} weight="duotone" />
            </span>
            <div>
              <p className="font-medium">Belum ada master barang</p>
              <p className="mt-1 max-w-sm text-sm text-muted">
                Tambah SKU pertama, misalnya Minyak (MYK-100) dengan konversi 1
                Drum = 200 Liter.
              </p>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="mt-1 inline-flex items-center gap-2 rounded-[var(--radius-app)] bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover dark:text-zinc-950"
            >
              <Plus size={16} weight="bold" />
              Tambah barang
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
            <p className="font-medium">Tidak ada hasil untuk &ldquo;{query.trim()}&rdquo;</p>
            <p className="max-w-sm text-sm text-muted">
              Coba kata kunci lain, atau kosongkan pencarian untuk melihat semua
              barang.
            </p>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="mt-2 rounded-[var(--radius-app)] border border-border px-3 py-1.5 text-sm font-medium hover:bg-surface-muted"
            >
              Hapus pencarian
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface-muted/70 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Barang</th>
                  <th className="px-4 py-3 font-medium">Konversi</th>
                  <th className="px-4 py-3 font-medium">Stok</th>
                  <th className="px-4 py-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr
                    key={product.id}
                    className="border-t border-border transition-colors hover:bg-surface-muted/40"
                  >
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-foreground">
                        {product.name}
                      </p>
                      <p className="font-mono text-xs text-muted">
                        {product.sku}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-muted">
                      <span className="text-foreground">
                        1 {product.purchaseUnit}
                      </span>{" "}
                      = {product.conversionRate} {product.saleUnit}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-medium">
                        {formatQty(product.stockQty)}
                      </span>
                      <span className="ml-1 text-muted">
                        {product.saleUnit}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(product)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-surface-muted hover:text-foreground active:scale-[0.98]"
                        >
                          <PencilSimple size={14} />
                          Ubah
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(product)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-danger hover:bg-danger-soft active:scale-[0.98]"
                        >
                          <Trash size={14} />
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {panelOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Tutup panel"
            className="absolute inset-0 cursor-default"
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
                <h2
                  id={dialogTitleId}
                  className="text-lg font-semibold tracking-tight"
                >
                  {editing ? "Ubah barang" : "Tambah barang"}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Isi satuan sebagai nama unit (Drum, Liter), bukan angka.
                </p>
              </div>
              <button
                type="button"
                aria-label="Tutup"
                onClick={closePanel}
                className="rounded-lg p-1.5 text-muted hover:bg-surface-muted hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <Field
                ref={firstFieldRef}
                label="Nama barang"
                value={form.name}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                placeholder="Minyak"
                required
              />
              <Field
                label="SKU"
                value={form.sku}
                onChange={(v) => setForm((f) => ({ ...f, sku: v }))}
                placeholder="MYK-100"
                required
                mono
              />
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Satuan pembelian"
                  value={form.purchaseUnit}
                  onChange={(v) => setForm((f) => ({ ...f, purchaseUnit: v }))}
                  placeholder="Drum"
                  required
                />
                <Field
                  label="Satuan penjualan"
                  value={form.saleUnit}
                  onChange={(v) => setForm((f) => ({ ...f, saleUnit: v }))}
                  placeholder="Liter"
                  required
                />
              </div>
              <Field
                label="Konversi satuan"
                value={form.conversionRate}
                onChange={(v) => setForm((f) => ({ ...f, conversionRate: v }))}
                placeholder="200"
                required
                helper={
                  form.purchaseUnit &&
                  form.saleUnit &&
                  Number(form.conversionRate) > 0
                    ? conversionHint
                    : undefined
                }
                inputMode="decimal"
              />

              {formError ? (
                <p className="rounded-[var(--radius-app)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
                  {formError}
                </p>
              ) : null}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closePanel}
                  className="rounded-[var(--radius-app)] border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted active:scale-[0.98]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-[var(--radius-app)] bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60 dark:text-zinc-950 active:scale-[0.98]"
                >
                  {saving ? "Menyimpan..." : editing ? "Simpan" : "Buat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus master barang?"
        description={
          deleteTarget
            ? `Hapus "${deleteTarget.name}" (${deleteTarget.sku})? Barang yang masih punya riwayat transaksi tidak dapat dihapus.`
            : ""
        }
        confirmLabel="Ya, hapus"
        cancelLabel="Batal"
        danger
        busy={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => {
          if (!deleting) setDeleteTarget(null);
        }}
      />

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-app)] border border-border bg-surface px-4 py-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 font-mono text-2xl font-semibold tracking-tight">
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  helper,
  mono,
  inputMode,
  ref,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  helper?: string;
  mono?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  ref?: React.Ref<HTMLInputElement>;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        inputMode={inputMode}
        className={[
          "rounded-[var(--radius-app)] border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent placeholder:text-muted/70 focus:ring-2",
          mono ? "font-mono uppercase" : "",
        ].join(" ")}
      />
      {helper ? <span className="text-xs text-muted">{helper}</span> : null}
    </label>
  );
}
