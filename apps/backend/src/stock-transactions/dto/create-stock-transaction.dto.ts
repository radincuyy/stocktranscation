import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { StockUnitType } from '@prisma/client';

export class CreateStockTransactionDto {
  @IsUUID()
  productId!: string;

  /** Tanggal transaksi YYYY-MM-DD (menentukan hari/bulan/tahun sequence). */
  @IsDateString()
  date!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0.000001)
  quantity!: number;

  /** PURCHASE = satuan grosir, SALE = satuan eceran / base stok */
  @IsEnum(StockUnitType)
  unitType!: StockUnitType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  /**
   * Sequence manual (opsional). Harus unik jika diisi.
   * Jika kosong, sistem generate otomatis STK/.../00001.
   */
  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && v !== '')
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sequenceNo?: string;
}
