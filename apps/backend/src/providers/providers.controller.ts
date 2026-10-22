import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  ProviderError,
  ProvidersService,
  type ProviderStatus,
} from './providers.service';
import {
  ProviderDto,
  SettingsDto,
  UpdateProviderDto,
  UpdateSettingsDto,
} from './dto';
import { findProvider } from './registry';

@ApiTags('providers')
@Controller('providers')
export class ProvidersController {
  constructor(private readonly providers: ProvidersService) {}

  @Get()
  @ApiOperation({
    summary: 'List providers',
    description:
      'Every CLI UnoComputer can drive, with whether its binary is on PATH and ' +
      'whether it is enabled in settings. The admin builds its model picker from this.',
  })
  @ApiResponse({ status: 200, type: [ProviderDto] })
  list(): Promise<ProviderStatus[]> {
    return this.providers.list();
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Enable or disable a provider',
    description:
      'A disabled provider is refused when a run names it, and skipped by the ' +
      'model preferences for a run that names none.',
  })
  @ApiParam({ name: 'id', example: 'devin' })
  @ApiResponse({ status: 200, type: ProviderDto })
  @ApiResponse({ status: 404, description: 'No such provider' })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateProviderDto,
  ): Promise<ProviderStatus> {
    if (!findProvider(id)) {
      throw new NotFoundException(`Provider ${id} not found`);
    }
    try {
      return await this.providers.setEnabled(id, body.enabled);
    } catch (error) {
      if (error instanceof ProviderError)
        throw new BadRequestException(error.message);
      throw error;
    }
  }
}

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly providers: ProvidersService) {}

  private async current(): Promise<SettingsDto> {
    const [modelPreferences, { model, unusable }] = await Promise.all([
      this.providers.modelPreferences(),
      this.providers.effectiveModel(),
    ]);
    return { modelPreferences, effectiveModel: model, unusable };
  }

  @Get()
  @ApiOperation({
    summary: 'Application settings',
    description:
      'The model preferences for runs that name none, and which of them a run ' +
      'would get right now.',
  })
  @ApiResponse({ status: 200, type: SettingsDto })
  get(): Promise<SettingsDto> {
    return this.current();
  }

  @Patch()
  @ApiOperation({
    summary: 'Update settings',
    description:
      'Replaces the model preferences. Each must name a known provider; none has ' +
      'to be enabled or installed, since the order exists to skip the ones that are not.',
  })
  @ApiResponse({ status: 200, type: SettingsDto })
  @ApiResponse({
    status: 400,
    description: 'A preference names an unknown provider',
  })
  async update(@Body() body: UpdateSettingsDto): Promise<SettingsDto> {
    try {
      await this.providers.setModelPreferences(body.modelPreferences);
    } catch (error) {
      if (error instanceof ProviderError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
    return this.current();
  }
}
