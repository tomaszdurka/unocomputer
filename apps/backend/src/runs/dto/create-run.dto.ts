import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRunDto {
  @ApiProperty({
    description: 'The prompt to execute with Claude',
    example: 'Write a function that calculates fibonacci numbers'
  })
  @IsString()
  @IsNotEmpty()
  prompt!: string;

  @ApiProperty({
    description: 'Optional JSON schema for structured output',
    required: false,
    example: { type: 'object', properties: { result: { type: 'number' } } }
  })
  @IsObject()
  @IsOptional()
  schema?: Record<string, unknown>;

  @ApiProperty({
    description: 'Optional workspace ID (creates new session in workspace if provided without sessionId)',
    required: false,
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsString()
  @IsOptional()
  @Matches(/^[a-f0-9-]+$/, { message: 'workspaceId must be a valid UUID format' })
  workspaceId?: string;

  @ApiProperty({
    description: 'Optional session ID (continues existing session if provided)',
    required: false,
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsString()
  @IsOptional()
  @Matches(/^[a-f0-9-]+$/, { message: 'sessionId must be a valid UUID format' })
  sessionId?: string;

  @ApiProperty({
    description:
      'Optional model to use: the CLI (claude, gemini, codex), optionally pinning ' +
      'the CLI model as "<cli>:<model>" (claude only), e.g. "claude:sonnet" or ' +
      '"claude:sonnet-4-5". Without the suffix the CLI default applies.',
    required: false,
    example: 'claude:sonnet'
  })
  @IsString()
  @IsOptional()
  @Matches(/^(claude(:[a-zA-Z0-9][a-zA-Z0-9._-]*)?|gemini|codex)$/, {
    message: 'model must be claude[:<model>], gemini, or codex',
  })
  model?: string;


  @ApiProperty({
    description:
      'Optional labels for this run, e.g. ["job-hunt","matching"]. Tags are ' +
      'for the caller, not the CLI: list runs by tag to ask "is one of my ' +
      'runs of this kind still in flight?" Lowercase slugs.',
    required: false,
    type: [String],
    example: ['job-hunt', 'matching'],
  })
  @IsArray()
  @IsOptional()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @Matches(/^[a-z0-9][a-z0-9._-]{0,39}$/, {
    each: true,
    message: 'each tag must be a lowercase slug, max 40 chars',
  })
  tags?: string[];
}
