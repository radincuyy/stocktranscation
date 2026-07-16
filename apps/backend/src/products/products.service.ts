import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponse, toProductResponse } from './products.mapper';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto): Promise<ProductResponse> {
    try {
      const product = await this.prisma.product.create({
        data: {
          name: dto.name.trim(),
          sku: dto.sku.trim().toUpperCase(),
          purchaseUnit: dto.purchaseUnit.trim(),
          saleUnit: dto.saleUnit.trim(),
          conversionRate: new Prisma.Decimal(dto.conversionRate),
        },
      });
      return toProductResponse(product);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async findAll(): Promise<ProductResponse[]> {
    const products = await this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return products.map(toProductResponse);
  }

  async findOne(id: string): Promise<ProductResponse> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with id "${id}" not found`);
    }
    return toProductResponse(product);
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductResponse> {
    await this.ensureExists(id);

    const data: Prisma.ProductUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.sku !== undefined) data.sku = dto.sku.trim().toUpperCase();
    if (dto.purchaseUnit !== undefined) {
      data.purchaseUnit = dto.purchaseUnit.trim();
    }
    if (dto.saleUnit !== undefined) data.saleUnit = dto.saleUnit.trim();
    if (dto.conversionRate !== undefined) {
      data.conversionRate = new Prisma.Decimal(dto.conversionRate);
    }

    try {
      const product = await this.prisma.product.update({
        where: { id },
        data,
      });
      return toProductResponse(product);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async remove(id: string): Promise<ProductResponse> {
    await this.ensureExists(id);

    try {
      const product = await this.prisma.product.delete({ where: { id } });
      return toProductResponse(product);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          'Cannot delete product that still has stock transactions',
        );
      }
      this.handlePrismaError(error);
    }
  }

  private async ensureExists(id: string): Promise<void> {
    const exists = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(`Product with id "${id}" not found`);
    }
  }

  private handlePrismaError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('SKU already exists');
    }
    throw error;
  }
}
