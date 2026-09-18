import { Controller, Get, Post, Patch, Param, Body, NotFoundException } from '@nestjs/common';
import type { Session } from '../database/types';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { PersistenceService } from '../database/persistence.service';
import { SessionDto } from '../database/dto';
import { CreateSessionDto, UpdateSessionDto } from './dto';

@ApiTags('sessions')
@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly db: PersistenceService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create session',
    description:
      'Create a session in a workspace ahead of its first run, optionally with a label. ' +
      'Runs address it by sessionId as usual.'
  })
  @ApiBody({ type: CreateSessionDto })
  @ApiResponse({ status: 201, description: 'Session created', type: SessionDto })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async createSession(@Body() dto: CreateSessionDto): Promise<Session> {
    const workspace = await this.db.getWorkspace({ workspaceId: dto.workspaceId });
    if (!workspace) {
      throw new NotFoundException(`Workspace ${dto.workspaceId} not found`);
    }
    return await this.db.createSession({ workspaceId: workspace.workspaceId, name: dto.name });
  }

  @Get()
  @ApiOperation({ summary: 'List all sessions', description: 'Get a list of all sessions across all workspaces' })
  @ApiResponse({ status: 200, description: 'List of sessions', type: [SessionDto] })
  async listSessions(): Promise<Session[]> {
    return await this.db.findAllSessions();
  }

  @Get(':sessionId')
  @ApiOperation({ summary: 'Get session details', description: 'Get detailed information about a specific session including all runs' })
  @ApiParam({ name: 'sessionId' })
  @ApiResponse({ status: 200, description: 'Session details with runs', type: SessionDto })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getSession(@Param('sessionId') sessionId: string): Promise<Session> {
    const session = await this.db.findSessionWithRuns({ sessionId });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    return session;
  }

  @Patch(':sessionId')
  @ApiOperation({ summary: 'Update session', description: 'Rename a session, or clear its label with null' })
  @ApiParam({ name: 'sessionId' })
  @ApiBody({ type: UpdateSessionDto })
  @ApiResponse({ status: 200, description: 'Session updated', type: SessionDto })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async updateSession(
    @Param('sessionId') sessionId: string,
    @Body() dto: UpdateSessionDto
  ): Promise<Session> {
    const session = await this.db.updateSession({ sessionId, ...dto });
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }
    return session;
  }
}
