import { Controller, Get, Post, Param, Patch, Body, Query, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import type { Workspace } from '../database/types';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { PersistenceService } from '../database/persistence.service';
import { WorkspaceDto } from '../database/dto';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from './dto';
import { WorkspaceDirectoryTakenError } from '../database/errors';
import { defaultWorkspaceDir, resolveCallerDirectory } from './workspace-directory';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('workspaces')
@Controller('workspaces')
export class WorkspacesController {
  constructor(
    private readonly db: PersistenceService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create workspace',
    description:
      'Create a workspace, either bound to an existing folder (`directory`) or as a ' +
      'managed folder under WORKSPACES_DIR. One folder = one workspace. Optional AGENTS.md.'
  })
  @ApiBody({ type: CreateWorkspaceDto })
  @ApiResponse({ status: 201, description: 'Workspace created successfully', type: WorkspaceDto })
  @ApiResponse({ status: 400, description: 'directory is relative, missing or not a directory' })
  @ApiResponse({ status: 409, description: 'A workspace already exists for that directory' })
  async createWorkspace(@Body() createDto: CreateWorkspaceDto): Promise<Workspace> {
    const workspaceId = uuidv4();
    let workingDir: string;

    if (createDto.directory) {
      // Binding to the caller's folder: it must exist, and nothing is created there.
      workingDir = resolveCallerDirectory(createDto.directory);
      const existing = await this.db.findWorkspaceByWorkingDir({ workingDir });
      if (existing) {
        throw new ConflictException(
          `${workingDir} already belongs to workspace ${existing.workspaceId}`
        );
      }
    } else {
      workingDir = defaultWorkspaceDir(workspaceId);
      fs.mkdirSync(workingDir, { recursive: true });
    }

    let workspace: Workspace;
    try {
      workspace = await this.db.createWorkspace({
        workspaceId,
        workingDir,
        name: createDto.name,
      });
    } catch (error) {
      // Two creates for the same folder racing past the check above.
      if (error instanceof WorkspaceDirectoryTakenError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }

    // Write AGENTS.md if provided
    if (createDto.agentsMd) {
      const agentsMdPath = path.join(workingDir, 'AGENTS.md');
      fs.writeFileSync(agentsMdPath, createDto.agentsMd, 'utf-8');
    }

    return workspace;
  }

  @Get()
  @ApiOperation({
    summary: 'List workspaces',
    description:
      'All workspaces, newest first. With `directory`, only the workspace bound to that ' +
      'folder (an array of one or none), so a caller can find "the workspace for this ' +
      'folder" before creating it.'
  })
  @ApiQuery({ name: 'directory', required: false, description: 'Absolute path of a folder' })
  @ApiResponse({ status: 200, description: 'List of workspaces', type: [WorkspaceDto] })
  async listWorkspaces(@Query('directory') directory?: string): Promise<Workspace[]> {
    if (directory === undefined) {
      return await this.db.findAllWorkspaces();
    }
    // Resolved the way a create resolves it, so the same folder is found under any
    // spelling. A folder that no longer exists cannot be canonicalised and has no
    // workspace to find.
    let workingDir: string;
    try {
      workingDir = fs.realpathSync.native(directory);
    } catch {
      return [];
    }
    const workspace = await this.db.findWorkspaceByWorkingDir({ workingDir });
    return workspace ? [workspace] : [];
  }

  @Get(':workspaceId')
  @ApiOperation({ summary: 'Get workspace details', description: 'Get detailed information about a workspace including all its runs' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: 'Workspace details with runs', type: WorkspaceDto })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async getWorkspace(@Param('workspaceId') workspaceId: string): Promise<Workspace> {
    const workspace = await this.db.findWorkspaceWithRuns({ id: workspaceId });

    if (!workspace) {
      throw new NotFoundException(`Workspace ${workspaceId} not found`);
    }

    return workspace;
  }

  @Patch(':workspaceId')
  @ApiOperation({ summary: 'Update workspace', description: 'Update workspace properties like name' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiBody({ type: UpdateWorkspaceDto })
  @ApiResponse({ status: 200, description: 'Workspace updated successfully', type: WorkspaceDto })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async updateWorkspace(
    @Param('workspaceId') workspaceId: string,
    @Body() updateDto: UpdateWorkspaceDto
  ): Promise<Workspace> {
    const workspace = await this.db.updateWorkspace({
      workspaceId,
      ...updateDto
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace ${workspaceId} not found`);
    }

    return workspace;
  }

  @Get(':workspaceId/files/:filename')
  @ApiOperation({
    summary: 'Read workspace file',
    description: 'Read specific markdown files from the workspace directory (AGENTS.md)'
  })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiParam({
    name: 'filename',
    description: 'File name',
    enum: ['AGENTS.md'],
    example: 'AGENTS.md'
  })
  @ApiResponse({ status: 200, description: 'File content', schema: { type: 'object', properties: { content: { type: 'string' } } } })
  @ApiResponse({ status: 404, description: 'Workspace or file not found' })
  @ApiResponse({ status: 400, description: 'Invalid filename' })
  async getWorkspaceFile(
    @Param('workspaceId') workspaceId: string,
    @Param('filename') filename: string
  ): Promise<{ content: string; filename: string }> {
    // Whitelist of allowed files
    const allowedFiles = ['AGENTS.md'];

    if (!allowedFiles.includes(filename)) {
      throw new BadRequestException(`File ${filename} is not allowed. Allowed files: ${allowedFiles.join(', ')}`);
    }

    const workspace = await this.db.getWorkspace({ workspaceId });
    if (!workspace) {
      throw new NotFoundException(`Workspace ${workspaceId} not found`);
    }

    const filePath = path.join(workspace.workingDir, filename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`File ${filename} not found in workspace`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    return { content, filename };
  }
}
