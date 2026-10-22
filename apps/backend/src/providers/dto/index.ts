import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsString,
  Matches,
} from 'class-validator';

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

export class SkippedModelDto {
  @ApiProperty({ example: 'claude' }) model!: string;
  @ApiProperty({ example: 'disabled' }) reason!: string;
}

export class SettingsDto {
  @ApiProperty({
    type: [String],
    example: ['claude:sonnet', 'codex', 'devin'],
    description:
      'Models for runs that name none, in order of preference. The first whose ' +
      'provider is enabled and installed is used. Each is "<provider>" or ' +
      '"<provider>:<model>".',
  })
  modelPreferences!: string[];

  @ApiProperty({
    nullable: true,
    example: 'claude:sonnet',
    description:
      'The preference a run would get right now; null when none is usable.',
  })
  effectiveModel!: string | null;

  @ApiProperty({
    type: [SkippedModelDto],
    description: 'Preferences passed over, and why.',
  })
  skipped!: SkippedModelDto[];
}

export class UpdateSettingsDto {
  @ApiProperty({ type: [String], example: ['claude:sonnet', 'codex'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @Matches(/^[a-z][a-z0-9-]*(:[A-Za-z0-9][A-Za-z0-9._-]*)?$/, {
    each: true,
    message: 'each preference must be "<provider>" or "<provider>:<model>"',
  })
  modelPreferences!: string[];
}
