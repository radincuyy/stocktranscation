import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CreateStockTransactionDto } from './dto/create-stock-transaction.dto';
import { StockTransactionsService } from './stock-transactions.service';

@Controller('stock-transactions')
export class StockTransactionsController {
  constructor(private readonly service: StockTransactionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateStockTransactionDto) {
    return this.service.create(dto).then((data) => ({
      data,
      message: 'Stock transaction created successfully',
    }));
  }

  @Get()
  findAll() {
    return this.service.findAll().then((data) => ({
      data,
      message: 'Stock transactions retrieved successfully',
    }));
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id).then((data) => ({
      data,
      message: 'Stock transaction retrieved successfully',
    }));
  }

  @Post(':id/cancel')
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.cancel(id).then((data) => ({
      data,
      message: 'Stock transaction cancelled; stock restored',
    }));
  }
}
