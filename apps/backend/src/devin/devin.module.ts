import { Module } from '@nestjs/common';
import { DevinService } from './devin.service';

@Module({
  providers: [DevinService],
  exports: [DevinService],
})
export class DevinModule {}
