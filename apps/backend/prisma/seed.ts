import 'dotenv/config';
import { PrismaClient, StockUnitType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Seed data contoh case:
 * - Master: Minyak / MYK-100 / 1 Drum = 200 Liter
 * - Transaksi: +1 Drum (stok base 200 Liter)
 *
 */
async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL belum di-set');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  const SEED_NOTE = 'SEED: penambahan 1 Drum';
  const SEED_SEQUENCE = 'STK/Senin/VII/2026/SEED1';
  const seedDate = new Date(Date.UTC(2026, 6, 13));

  try {
    const product = await prisma.product.upsert({
      where: { sku: 'MYK-100' },
      update: {
        name: 'Minyak',
        purchaseUnit: 'Drum',
        saleUnit: 'Liter',
        conversionRate: 200,
      },
      create: {
        name: 'Minyak',
        sku: 'MYK-100',
        purchaseUnit: 'Drum',
        saleUnit: 'Liter',
        conversionRate: 200,
        stockQty: 0,
      },
    });

    await prisma.stockTransaction.deleteMany({
      where: {
        OR: [{ note: SEED_NOTE }, { sequenceNo: SEED_SEQUENCE }],
      },
    });

    await prisma.stockTransaction.create({
      data: {
        sequenceNo: SEED_SEQUENCE,
        date: seedDate,
        productId: product.id,
        quantity: 1,
        unitType: StockUnitType.PURCHASE,
        baseQty: 200,
        note: SEED_NOTE,
        status: 'ACTIVE',
      },
    });

    const active = await prisma.stockTransaction.findMany({
      where: { productId: product.id, status: 'ACTIVE' },
    });
    const stockQty = active.reduce((sum, tx) => sum + Number(tx.baseQty), 0);

    await prisma.product.update({
      where: { id: product.id },
      data: { stockQty },
    });

    await prisma.sequenceCounter.upsert({
      where: { key: 'Senin-VII-2026' },
      update: {},
      create: { key: 'Senin-VII-2026', lastValue: 1 },
    });

    console.log('Seed selesai:');
    console.log(`  Product : ${product.name} (${product.sku})`);
    console.log('  Konversi: 1 Drum = 200 Liter');
    console.log(`  Stok    : ${stockQty} Liter`);
    console.log(`  Tx seed : ${SEED_SEQUENCE}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
