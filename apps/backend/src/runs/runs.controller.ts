import { Controller, Get, Post, Param, Body, Query, Res, Headers, NotFoundException, BadRequestException } from '@nestjs/common';
import { CliEvent, JsonObject } from '../lib/json';
import type { Run } from '../database/types';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { RunDto } from '../database/dto';
import { RUN_STATUSES } from '../database/run-status';
import { CreateRunDto } from './dto/create-run.dto';
import type { RunResult } from './dto/run-options';
import { PersistenceService } from '../database/persistence.service';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'node:fs';
import { defaultWorkspaceDir } from '../workspaces/workspace-directory';
import {RunsService} from "./runs.service";

@ApiTags('runs')
@Controller('runs')
export class RunsController {
  constructor(
    private readonly persistence: PersistenceService,
    private readonly runs: RunsService,
  ) {
  }

  private async prepareRun(dto: CreateRunDto) {
    let workspace;
    let session;

    if (dto.sessionId) {
      // Continue existing session
      session = await this.persistence.getSession({ sessionId: dto.sessionId });
      if (!session) {
        throw new NotFoundException(`Session ${dto.sessionId} not found`);
      }
      workspace = session.workspace;

      // If workspaceId also provided, validate it matches
      if (dto.workspaceId && workspace.workspaceId !== dto.workspaceId) {
        throw new BadRequestException(
          `Session ${dto.sessionId} belongs to workspace ${workspace.workspaceId}, not ${dto.workspaceId}`
        );
      }
    } else if (dto.workspaceId) {
      // Create new session in existing workspace
      workspace = await this.persistence.getWorkspace({ workspaceId: dto.workspaceId });
      if (!workspace) {
        throw new NotFoundException(`Workspace ${dto.workspaceId} not found`);
      }
      session = await this.persistence.createSession({ workspaceId: workspace.workspaceId });
    } else {
      // Create new workspace and session
      const workspaceId = uuidv4();
      const workingDir = defaultWorkspaceDir(workspaceId);
      fs.mkdirSync(workingDir, { recursive: true });
      workspace = await this.persistence.createWorkspace({ workspaceId, workingDir });
      session = await this.persistence.createSession({ workspaceId: workspace.workspaceId });
    }

    // Create run
    const run = await this.persistence.createRun({
      prompt: dto.prompt,
      sessionId: session.sessionId,
      workspaceId: workspace.workspaceId,
      outputSchema: dto.schema,
      model: dto.model,
      tags: dto.tags,
    });

    return { run, session, workspace };
  }

  @Post('queue')
  @ApiOperation({
    summary: 'Queue run execution',
    description: 'Queue a Claude CLI run for execution and return immediately with 201 Created. Provide sessionId to continue session, workspaceId to create new session in workspace, or neither to create new workspace.'
  })
  @ApiResponse({
    status: 201,
    description: 'Job queued successfully',
    schema: {
      type: 'object',
      properties: {
        runId: { type: 'string' },
        sessionId: { type: 'string' },
        workspaceId: { type: 'string' },
      }
    }
  })
  async queueRun(@Body() dto: CreateRunDto, @Res() res: Response): Promise<void> {
    const { run, session, workspace } = await this.prepareRun(dto);

    // Start job asynchronously
    this.runs.run({
      run,
      session,
      workspace,
    }).catch(err => {
      console.error(`Error in background job ${run.runId}:`, err);
    });

    res.status(201).json({
      runId: run.runId,
      sessionId: session.sessionId,
      workspaceId: workspace.workspaceId,
    });
  }

  @Post()
  @ApiOperation({
    summary: 'Execute run',
    description: 'Execute a Claude CLI run. Supports streaming (application/x-ndjson) and buffered modes. Provide sessionId to continue session, workspaceId to create new session in workspace, or neither to create new workspace.'
  })
  @ApiResponse({
    status: 200,
    description: 'Run completed or streaming',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
            workspaceId: { type: 'string' },
            sessionId: { type: 'string' },
            runId: { type: 'string' },
            result: { type: 'object' },
            structuredResult: { type: 'object' }
          }
        }
      },
      'application/x-ndjson': {
        // OpenAPI 3.2 itemSchema not yet supported by @nestjs/swagger 11.2.6
        // Using schema as workaround - manually add itemSchema to generated spec if needed
        schema: {
          type: 'string',
          description: 'Newline-delimited JSON stream of events'
        }
      } as JsonObject
    }
  })
  async executeRun(
    @Body() dto: CreateRunDto,
    @Headers('accept') accept: string,
    @Res() res: Response,
  ): Promise<void> {
    const { run, session, workspace } = await this.prepareRun(dto);

    const isStreaming = accept?.includes('application/x-ndjson');
    let clientDisconnected = false;

    const writeEvent = (event: CliEvent | RunResult) => {
      if (!clientDisconnected) {
        res.write(JSON.stringify({
          timestamp: new Date().toISOString(),
          workspaceId: workspace.workspaceId,
          sessionId: session.sessionId,
          runId: run.runId,
          ...event
        }) + '\n');
      }
    };

    res.on('close', () => clientDisconnected = true);

    if (isStreaming) {
      res.setHeader('Content-Type', 'application/x-ndjson');
      res.setHeader('Cache-Control', 'no-cache');
      writeEvent({ type: 'start' });
    }

    const result = await this.runs.run({
      run,
      session,
      workspace,
      env: dto.env,
      onOutput: isStreaming ? writeEvent : undefined,
    });

    writeEvent(result);

    res.end();
  }

  @Get()
  @ApiOperation({
    summary: 'List runs',
    description:
      'All runs across all workspaces, newest first. Narrow with `tag` ' +
      '(repeatable - a run must carry EVERY tag given) and `status`, so a ' +
      'caller can ask "do I already have a run of this kind in flight?"',
  })
  @ApiQuery({
    name: 'tag',
    required: false,
    isArray: true,
    type: String,
    description: 'Repeatable. Runs must carry every tag given.',
  })
  @ApiQuery({ name: 'status', required: false, enum: RUN_STATUSES })
  @ApiResponse({ status: 200, description: 'List of runs', type: [RunDto] })
  async listRuns(
    @Query('tag') tag?: string | string[],
    @Query('status') status?: string,
  ): Promise<Run[]> {
    const tags = tag === undefined ? [] : Array.isArray(tag) ? tag : [tag];
    return await this.persistence.findAllRuns({ tags, status });
  }

  @Get(':runId')
  @ApiOperation({ summary: 'Get run details', description: 'Get detailed information about a specific run including all events' })
  @ApiParam({ name: 'runId'})
  @ApiResponse({ status: 200, description: 'Run details with events', type: RunDto })
  @ApiResponse({ status: 404, description: 'Run not found' })
  async getRun(@Param('runId') runId: string): Promise<Run> {
    const run = await this.persistence.findRunWithEvents({ runId });

    if (!run) {
      throw new NotFoundException(`Run ${runId} not found`);
    }

    return run;
  }
}
