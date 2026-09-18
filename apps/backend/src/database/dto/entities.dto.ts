import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RUN_STATUSES } from '../run-status';

// Swagger response shapes. These used to be the MikroORM entity classes, which carried
// @ApiProperty decorators directly. Prisma models are plain generated types with nowhere
// to hang decorators, so the documented shape lives here - the same split the template
// uses. They describe what the controllers return; they are not used for validation.

export class WorkspaceDto {
  @ApiProperty({ description: 'Workspace unique identifier' })
  workspaceId!: string;

  @ApiProperty({ description: 'Workspace directory path' })
  workingDir!: string;

  @ApiPropertyOptional({ type: String, nullable: true, description: 'Workspace name' })
  name!: string | null;

  @ApiProperty({ description: 'Workspace creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Workspace last update timestamp' })
  updatedAt!: Date;

  @ApiPropertyOptional({ type: () => [RunDto], description: 'Runs in this workspace' })
  runs?: RunDto[];

  @ApiPropertyOptional({ type: () => [SessionDto], description: 'Sessions in this workspace' })
  sessions?: SessionDto[];
}

export class SessionDto {
  @ApiProperty({ description: 'Session unique identifier' })
  sessionId!: string;

  @ApiPropertyOptional({ type: String, nullable: true, description: 'Session label' })
  name!: string | null;

  @ApiProperty({ description: 'Session creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Session last update timestamp' })
  updatedAt!: Date;

  @ApiProperty({ description: 'Workspace this session belongs to' })
  workspaceId!: string;

  @ApiPropertyOptional({ type: () => WorkspaceDto })
  workspace?: WorkspaceDto;

  @ApiPropertyOptional({ type: () => [RunDto], description: 'All runs in this session' })
  runs?: RunDto[];
}

export class RunEventDto {
  @ApiProperty({ description: 'Event unique identifier' })
  id!: string;

  @ApiProperty({ description: 'Event type', example: 'text' })
  type!: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'Raw event emitted by the CLI',
  })
  payload!: Record<string, unknown>;

  @ApiProperty({ description: 'Ordering within the run' })
  sequence!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ description: 'Run this event belongs to' })
  runId!: string;
}

export class RunDto {
  @ApiProperty({ description: 'Run unique identifier' })
  runId!: string;

  @ApiProperty({ description: 'The prompt that was executed' })
  prompt!: string;

  @ApiPropertyOptional({ type: String, nullable: true, description: 'Model used' })
  model!: string | null;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    nullable: true,
    description: 'Output JSON schema if provided',
  })
  outputSchema?: Record<string, unknown>;

  @ApiProperty({
    type: [String],
    description: 'Caller-supplied labels, e.g. ["job-hunt","matching"]',
  })
  tags!: string[];

  @ApiProperty({ description: 'Run status', enum: RUN_STATUSES })
  status!: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    nullable: true,
    description: 'Run result data',
  })
  result?: Record<string, unknown>;

  @ApiPropertyOptional({ type: Number, nullable: true, description: 'Process exit code' })
  exitCode!: number | null;

  @ApiProperty({ description: 'Run start timestamp' })
  startedAt!: Date;

  @ApiPropertyOptional({ type: Date, nullable: true })
  completedAt!: Date | null;

  @ApiPropertyOptional({ type: Date, nullable: true })
  lastHeartbeat!: Date | null;

  @ApiProperty({ description: 'Session this run belongs to' })
  sessionId!: string;

  @ApiProperty({ description: 'Workspace this run belongs to' })
  workspaceId!: string;

  @ApiPropertyOptional({ type: () => SessionDto })
  session?: SessionDto;

  @ApiPropertyOptional({ type: () => WorkspaceDto })
  workspace?: WorkspaceDto;

  @ApiPropertyOptional({ type: () => [RunEventDto], description: 'All events from the run' })
  events?: RunEventDto[];
}

export class PromptDto {
  @ApiProperty({ description: 'Prompt unique identifier' })
  promptId!: string;

  @ApiProperty({ description: 'Prompt name' })
  name!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description!: string | null;

  @ApiProperty({ description: 'The prompt text' })
  prompt!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
