import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWorkspaceDto {
  @ApiProperty({
    description:
      'Absolute path of an existing folder to bind the workspace to. Omit to get a ' +
      'managed folder under WORKSPACES_DIR. 400 when the path is relative, missing or ' +
      'not a directory; 409 when a workspace already exists for it.',
    required: false,
    example: '/Users/me/projects/app'
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  directory?: string;

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
