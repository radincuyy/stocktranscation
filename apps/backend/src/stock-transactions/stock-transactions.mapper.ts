import { Product, StockTransaction } from '@prisma/client';
import { formatDateOnly } from '../sequence/sequence.util';

export type StockTransactionResponse = {
  id: string;
  sequenceNo: string;
  date: string;
  productId: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    purchaseUnit: string;
    saleUnit: string;
    conversionRate: string;
    stockQty: string;
  };
  quantity: string;
  unitType: string;
  baseQty: string;
  note: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type Row = StockTransaction & { product?: Product };

export function toStockTransactionResponse(
  row: Row,
): StockTransactionResponse {
  return {
    id: row.id,
    sequenceNo: row.sequenceNo,
    date: formatDateOnly(row.date),
    productId: row.productId,
    product: row.product
      ? {
          id: row.product.id,
          name: row.product.name,
          sku: row.product.sku,
          purchaseUnit: row.product.purchaseUnit,
          saleUnit: row.product.saleUnit,
          conversionRate: row.product.conversionRate.toString(),
          stockQty: row.product.stockQty.toString(),
        }
      : undefined,
    quantity: row.quantity.toString(),
    unitType: row.unitType,
    baseQty: row.baseQty.toString(),
    note: row.note,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
