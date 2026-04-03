import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWorkspaceDto {
  @ApiProperty({
    description: 'Workspace name',
    required: false,
    example: 'My Project Workspace'
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'AGENTS.md content to create in workspace',
    required: false,
    example: '# Project Guidelines\n\nWrite clean code...'
  })
  @IsString()
  @IsOptional()
  agentsMd?: string;
}
