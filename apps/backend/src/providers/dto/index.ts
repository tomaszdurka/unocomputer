import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString, Matches } from 'class-validator';

export class ProviderDto {
  @ApiProperty({ example: 'claude' }) id!: string;
  @ApiProperty({ example: 'Claude Code' }) label!: string;
  @ApiProperty({
    example: 'claude',
    description: 'The binary looked up on PATH',
  })
  binary!: string;
  @ApiProperty({ description: 'Whether "<id>:<model>" pins the CLI model' })
  pinnable!: boolean;
  @ApiProperty({
    type: [String],
    description: 'Suggested models, not a whitelist',
  })
  models!: string[];
  @ApiProperty({ description: 'The binary is on PATH' }) available!: boolean;
  @ApiProperty({ nullable: true, example: '/opt/homebrew/bin/claude' })
  path!: string | null;
  @ApiProperty({ description: 'Not switched off in settings' })
  enabled!: boolean;
}

export class UpdateProviderDto {
  @ApiProperty() @IsBoolean() enabled!: boolean;
}

export class SettingsDto {
  @ApiProperty({
    example: 'claude:sonnet',
    description:
      'Model for runs that name none: "<provider>" or "<provider>:<model>"',
  })
  defaultModel!: string;
}

export class UpdateSettingsDto {
  @ApiProperty({ example: 'claude:sonnet' })
  @IsString()
  @Matches(/^[a-z][a-z0-9-]*(:[A-Za-z0-9][A-Za-z0-9._-]*)?$/, {
    message: 'defaultModel must be "<provider>" or "<provider>:<model>"',
  })
  defaultModel!: string;
}
