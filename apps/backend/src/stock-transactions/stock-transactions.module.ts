import { Module } from '@nestjs/common';
import { SequenceService } from '../sequence/sequence.service';
import { StockTransactionsController } from './stock-transactions.controller';
import { StockTransactionsService } from './stock-transactions.service';

@Module({
  controllers: [StockTransactionsController],
  providers: [StockTransactionsService, SequenceService],
  exports: [StockTransactionsService, SequenceService],
})
export class StockTransactionsModule {}
