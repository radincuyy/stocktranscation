import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, StockUnitType, TransactionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SequenceService } from '../sequence/sequence.service';
import { StockTransactionsService } from './stock-transactions.service';

describe('StockTransactionsService', () => {
  let service: StockTransactionsService;
  let prisma: {
    $transaction: jest.Mock;
    stockTransaction: { findMany: jest.Mock; findUnique: jest.Mock };
  };
  let sequence: { nextAutoSequence: jest.Mock; assertManualUnique: jest.Mock };

  const product = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Minyak',
    sku: 'MYK-100',
    purchaseUnit: 'Drum',
    saleUnit: 'Liter',
    conversionRate: new Prisma.Decimal(200),
    stockQty: new Prisma.Decimal(0),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(),
      stockTransaction: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };
    sequence = {
      nextAutoSequence: jest.fn().mockResolvedValue('STK/Senin/VII/2026/00001'),
      assertManualUnique: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockTransactionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: SequenceService, useValue: sequence },
      ],
    }).compile();

    service = module.get(StockTransactionsService);
  });

  it('converts PURCHASE qty to base units (1 Drum = 200 Liter)', async () => {
    prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      const tx = {
        product: {
          findUnique: jest.fn().mockResolvedValue(product),
          update: jest.fn().mockResolvedValue({
            ...product,
            stockQty: new Prisma.Decimal(200),
          }),
          findUniqueOrThrow: jest.fn().mockResolvedValue({
            ...product,
            stockQty: new Prisma.Decimal(200),
          }),
        },
        stockTransaction: {
          create: jest.fn().mockResolvedValue({
            id: '22222222-2222-2222-2222-222222222222',
            sequenceNo: 'STK/Senin/VII/2026/00001',
            date: new Date(2026, 6, 13),
            productId: product.id,
            quantity: new Prisma.Decimal(1),
            unitType: StockUnitType.PURCHASE,
            baseQty: new Prisma.Decimal(200),
            note: null,
            status: TransactionStatus.ACTIVE,
            createdAt: new Date(),
            updatedAt: new Date(),
            product: { ...product, stockQty: new Prisma.Decimal(200) },
          }),
        },
      };
      return fn(tx);
    });

    const result = await service.create({
      productId: product.id,
      date: '2026-07-13',
      quantity: 1,
      unitType: StockUnitType.PURCHASE,
    });

    expect(result.baseQty).toBe('200');
    expect(result.sequenceNo).toBe('STK/Senin/VII/2026/00001');
    expect(sequence.nextAutoSequence).toHaveBeenCalled();
  });

  it('throws NotFound when product missing', async () => {
    prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      const tx = {
        product: { findUnique: jest.fn().mockResolvedValue(null) },
      };
      return fn(tx);
    });

    await expect(
      service.create({
        productId: product.id,
        date: '2026-07-13',
        quantity: 1,
        unitType: StockUnitType.SALE,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects invalid date', async () => {
    await expect(
      service.create({
        productId: product.id,
        date: '13-07-2026',
        quantity: 1,
        unitType: StockUnitType.SALE,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
