import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { IsUnitName } from '../../common/validators/is-unit-name.validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  sku!: string;

  /** Nama satuan pembelian grosir, contoh: "Drum" (bukan angka quantity). */
  @IsString()
  @IsNotEmpty()
  @IsUnitName()
  @MaxLength(50)
  purchaseUnit!: string;

  /** Nama satuan penjualan/eceran (base stok), contoh: "Liter" (bukan angka quantity). */
  @IsString()
  @IsNotEmpty()
  @IsUnitName()
  @MaxLength(50)
  saleUnit!: string;

  /**
   * Berapa satuan jual yang setara dengan 1 satuan beli.
   * Contoh: 1 Drum = 200 Liter → conversionRate = 200
   */
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0.000001)
  conversionRate!: number;
}
