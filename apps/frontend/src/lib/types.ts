export type Product = {
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

export type CreateProductInput = {
  name: string;
  sku: string;
  purchaseUnit: string;
  saleUnit: string;
  conversionRate: number;
};

export type UpdateProductInput = Partial<CreateProductInput>;

export type StockUnitType = "PURCHASE" | "SALE";
export type TransactionStatus = "ACTIVE" | "CANCELLED";

export type StockTransaction = {
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
  unitType: StockUnitType;
  baseQty: string;
  note: string | null;
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateStockTransactionInput = {
  productId: string;
  date: string;
  quantity: number;
  unitType: StockUnitType;
  note?: string;
  sequenceNo?: string;
};
