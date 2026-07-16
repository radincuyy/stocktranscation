import { Product } from '@prisma/client';

export type ProductResponse = {
  id: string;
  name: string;
  sku: string;
  purchaseUnit: string;
  saleUnit: string;
  conversionRate: string;
  stockQty: string;
  createdAt: string;
  updatedAt: string;
};

export function toProductResponse(product: Product): ProductResponse {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    purchaseUnit: product.purchaseUnit,
    saleUnit: product.saleUnit,
    conversionRate: product.conversionRate.toString(),
    stockQty: product.stockQty.toString(),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}
