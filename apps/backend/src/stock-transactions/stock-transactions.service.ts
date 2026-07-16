import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StockUnitType, TransactionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SequenceService } from '../sequence/sequence.service';
import { parseDateOnly } from '../sequence/sequence.util';
import { CreateStockTransactionDto } from './dto/create-stock-transaction.dto';
import {
  StockTransactionResponse,
  toStockTransactionResponse,
} from './stock-transactions.mapper';

@Injectable()
export class StockTransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequence: SequenceService,
  ) {}

  async create(
    dto: CreateStockTransactionDto,
  ): Promise<StockTransactionResponse> {
    let date: Date;
    try {
      date = parseDateOnly(dto.date);
    } catch {
      throw new BadRequestException('Date must be a valid YYYY-MM-DD');
    }

    const manual = dto.sequenceNo?.trim() || undefined;

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({
          where: { id: dto.productId },
        });
        if (!product) {
          throw new NotFoundException(
            `Product with id "${dto.productId}" not found`,
          );
        }

        const qty = new Prisma.Decimal(dto.quantity);
        const baseQty = this.toBaseQty(
          qty,
          dto.unitType,
          product.conversionRate,
        );

        let sequenceNo: string;
        if (manual) {
          await this.sequence.assertManualUnique(tx, manual);
          sequenceNo = manual;
        } else {
          sequenceNo = await this.sequence.nextAutoSequence(tx, date);
        }

        const row = await tx.stockTransaction.create({
          data: {
            sequenceNo,
            date,
            productId: product.id,
            quantity: qty,
            unitType: dto.unitType,
            baseQty,
            note: dto.note?.trim() || null,
            status: TransactionStatus.ACTIVE,
          },
          include: { product: true },
        });

        await tx.product.update({
          where: { id: product.id },
          data: { stockQty: { increment: baseQty } },
        });

        // muat ulang stok produk untuk response
        const fresh = await tx.product.findUniqueOrThrow({
          where: { id: product.id },
        });
        return { ...row, product: fresh };
      });

      return toStockTransactionResponse(created);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Sequence already exists');
      }
      throw error;
    }
  }

  async findAll(): Promise<StockTransactionResponse[]> {
    const rows = await this.prisma.stockTransaction.findMany({
      include: { product: true },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map(toStockTransactionResponse);
  }

  async findOne(id: string): Promise<StockTransactionResponse> {
    const row = await this.prisma.stockTransaction.findUnique({
      where: { id },
      include: { product: true },
    });
    if (!row) {
      throw new NotFoundException(`Transaction with id "${id}" not found`);
    }
    return toStockTransactionResponse(row);
  }

  async cancel(id: string): Promise<StockTransactionResponse> {
    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        const row = await tx.stockTransaction.findUnique({
          where: { id },
          include: { product: true },
        });
        if (!row) {
          throw new NotFoundException(`Transaction with id "${id}" not found`);
        }
        if (row.status === TransactionStatus.CANCELLED) {
          throw new BadRequestException('Transaction already cancelled');
        }

        const product = await tx.product.findUniqueOrThrow({
          where: { id: row.productId },
        });
        if (product.stockQty.lessThan(row.baseQty)) {
          throw new BadRequestException(
            'Cannot cancel: current stock is lower than transaction base quantity',
          );
        }

        const cancelled = await tx.stockTransaction.update({
          where: { id },
          data: { status: TransactionStatus.CANCELLED },
          include: { product: true },
        });

        const freshProduct = await tx.product.update({
          where: { id: row.productId },
          data: { stockQty: { decrement: row.baseQty } },
        });

        return { ...cancelled, product: freshProduct };
      });

      return toStockTransactionResponse(updated);
    } catch (error) {
      throw error;
    }
  }

  private toBaseQty(
    quantity: Prisma.Decimal,
    unitType: StockUnitType,
    conversionRate: Prisma.Decimal,
  ): Prisma.Decimal {
    if (unitType === StockUnitType.SALE) {
      return quantity;
    }
    // PURCHASE: qty * conversionRate → satuan base (jual)
    return quantity.mul(conversionRate);
  }
}
