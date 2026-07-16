import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  formatSequence,
  getSequenceParts,
  SequenceParts,
} from './sequence.util';

type TxClient = Prisma.TransactionClient;

@Injectable()
export class SequenceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Sequence otomatis berikutnya di dalam transaksi DB yang sudah berjalan.
   * Mengunci baris counter (SELECT ... FOR UPDATE) agar aman concurrent.
   */
  async nextAutoSequence(tx: TxClient, date: Date): Promise<string> {
    const parts = getSequenceParts(date);
    await this.ensureCounter(tx, parts.counterKey);
    const next = await this.lockAndIncrement(tx, parts.counterKey);
    return formatSequence(parts, next);
  }

  /**
   * Pastikan sequence manual unik.
   * Sequence manual tidak mengonsumsi running number auto.
   */
  async assertManualUnique(tx: TxClient, sequenceNo: string): Promise<void> {
    const exists = await tx.stockTransaction.findUnique({
      where: { sequenceNo },
      select: { id: true },
    });
    if (exists) {
      throw new ConflictException('Sequence already exists');
    }
  }

  preview(date: Date, runningNumber: number): {
    parts: SequenceParts;
    sequenceNo: string;
  } {
    const parts = getSequenceParts(date);
    return { parts, sequenceNo: formatSequence(parts, runningNumber) };
  }

  private async ensureCounter(tx: TxClient, key: string): Promise<void> {
    const existing = await tx.sequenceCounter.findUnique({ where: { key } });
    if (existing) return;
    try {
      await tx.sequenceCounter.create({ data: { key, lastValue: 0 } });
    } catch (error) {
      // create bersamaan (race) — abaikan pelanggaran unique
      if (
        !(
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        )
      ) {
        throw error;
      }
    }
  }

  private async lockAndIncrement(
    tx: TxClient,
    key: string,
  ): Promise<number> {
    // Kunci baris agar increment aman di multi-user
    const rows = await tx.$queryRaw<Array<{ lastValue: number }>>`
      SELECT "lastValue" FROM sequence_counters WHERE key = ${key} FOR UPDATE
    `;
    if (!rows.length) {
      // seharusnya tidak terjadi setelah ensureCounter
      await tx.sequenceCounter.create({ data: { key, lastValue: 1 } });
      return 1;
    }
    const next = Number(rows[0].lastValue) + 1;
    await tx.sequenceCounter.update({
      where: { key },
      data: { lastValue: next },
    });
    return next;
  }
}
