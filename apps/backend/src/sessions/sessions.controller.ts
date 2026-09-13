import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import type { Session } from '../database/types';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PersistenceService } from '../database/persistence.service';
import { SessionDto } from '../database/dto';

@ApiTags('sessions')
@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly db: PersistenceService,
  ) {}

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
}
