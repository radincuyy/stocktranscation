import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from './products.service';

const sampleProduct = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Minyak',
  sku: 'MYK-100',
  purchaseUnit: 'Drum',
  saleUnit: 'Liter',
  conversionRate: new Prisma.Decimal(200),
  stockQty: new Prisma.Decimal(0),
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: {
    product: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      product: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(ProductsService);
  });

  it('creates a product and maps decimals to string', async () => {
    prisma.product.create.mockResolvedValue(sampleProduct);

    const result = await service.create({
      name: 'Minyak',
      sku: 'myk-100',
      purchaseUnit: 'Drum',
      saleUnit: 'Liter',
      conversionRate: 200,
    });

    expect(prisma.product.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sku: 'MYK-100',
        name: 'Minyak',
      }),
    });
    expect(result.conversionRate).toBe('200');
    expect(result.stockQty).toBe('0');
  });

  it('throws ConflictException on duplicate SKU', async () => {
    const error = new Prisma.PrismaClientKnownRequestError('Unique', {
      code: 'P2002',
      clientVersion: 'test',
    });
    prisma.product.create.mockRejectedValue(error);

    await expect(
      service.create({
        name: 'Minyak',
        sku: 'MYK-100',
        purchaseUnit: 'Drum',
        saleUnit: 'Liter',
        conversionRate: 200,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws NotFoundException when product missing', async () => {
    prisma.product.findUnique.mockResolvedValue(null);

    await expect(service.findOne(sampleProduct.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws BadRequestException when delete blocked by FK', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: sampleProduct.id });
    const error = new Prisma.PrismaClientKnownRequestError('FK', {
      code: 'P2003',
      clientVersion: 'test',
    });
    prisma.product.delete.mockRejectedValue(error);

    await expect(service.remove(sampleProduct.id)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
