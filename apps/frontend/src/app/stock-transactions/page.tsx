import type { Metadata } from "next";
import { StockTransactionsView } from "@/components/stock-transactions/stock-transactions-view";

export const metadata: Metadata = {
  title: "Transaksi Stok",
};

export default function StockTransactionsPage() {
  return <StockTransactionsView />;
}
