/*
  Warnings:

  - Added the required column `baseQty` to the `stock_transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "stock_transactions" ADD COLUMN     "baseQty" DECIMAL(18,6) NOT NULL;
