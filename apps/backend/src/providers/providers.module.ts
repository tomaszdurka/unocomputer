import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { ProvidersService } from './providers.service';
import {
  ProvidersController,
  SettingsController,
} from './providers.controller';

@Module({
  imports: [SettingsModule],
  controllers: [ProvidersController, SettingsController],
  providers: [ProvidersService],
  exports: [ProvidersService],
})
export class ProvidersModule {}
