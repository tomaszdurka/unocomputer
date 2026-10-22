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
      'A disabled provider is refused at run creation. The provider of the default ' +
      'model cannot be disabled; change the default first.',
  })
  @ApiParam({ name: 'id', example: 'devin' })
  @ApiResponse({ status: 200, type: ProviderDto })
  @ApiResponse({ status: 404, description: 'No such provider' })
  @ApiResponse({ status: 400, description: 'It provides the default model' })
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

  @Get()
  @ApiOperation({ summary: 'Application settings' })
  @ApiResponse({ status: 200, type: SettingsDto })
  async get(): Promise<SettingsDto> {
    return { defaultModel: await this.providers.defaultModel() };
  }

  @Patch()
  @ApiOperation({
    summary: 'Update settings',
    description:
      'defaultModel must name a known, enabled provider; it need not be installed yet.',
  })
  @ApiResponse({ status: 200, type: SettingsDto })
  @ApiResponse({ status: 400, description: 'Unknown or disabled provider' })
  async update(@Body() body: UpdateSettingsDto): Promise<SettingsDto> {
    try {
      await this.providers.setDefaultModel(body.defaultModel);
    } catch (error) {
      if (error instanceof ProviderError)
        throw new BadRequestException(error.message);
      throw error;
    }
    return { defaultModel: await this.providers.defaultModel() };
  }
}
