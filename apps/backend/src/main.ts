import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';
import { sessionsDir } from './lib/session-storage';

// The backend has no TCP port. It listens on a unix domain socket (SOCKET_PATH) and the
// admin proxies /api/* to it, so the browser only ever talks to the admin's single port.
// For direct debugging: curl --unix-socket <socket> http://localhost/api/..., or bridge
// with socat if a tool can't speak sockets.
const defaultSocketPath = path.resolve(process.cwd(), '../../data/backend.sock');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable shutdown hooks for proper cleanup
  app.enableShutdownHooks();

  // Everything the backend serves lives under /api, which is also the only path the
  // admin proxies through to the socket.
  app.setGlobalPrefix('api');

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('UnoComputer API')
    .setDescription('REST API for Claude CLI with workspace isolation and persistence')
    .setVersion('1.0')
    .addTag('runs', 'Claude run execution and querying')
    .addTag('workspaces', 'Workspace management and querying')
  const document = SwaggerModule.createDocument(app, config.build(), {
    operationIdFactory: (_controllerKey: string, methodKey: string) => methodKey,
  });
  // The API root serves its own docs: /api -> swagger UI, /api/openapi.json -> raw spec.
  SwaggerModule.setup('api', app, document, {
    jsonDocumentUrl: 'api/openapi.json',
  });

  // The database directory must exist before Prisma opens the file. Schema changes are
  // applied by `prisma migrate deploy`, not at boot - the previous ORM mutated the
  // schema on every start, which silently rewrote column types out from under it.
  const dbFile = (process.env.DATABASE_URL ?? '').replace(/^file:/, '');
  if (dbFile) fs.mkdirSync(path.dirname(dbFile), { recursive: true });

  // Uno's per-session CLI state (codex/gemini resume ids) lives here, never in a
  // workspace folder, which may be a real project of the caller's.
  fs.mkdirSync(sessionsDir(), { recursive: true });

  const socketPath = process.env.SOCKET_PATH ?? defaultSocketPath;
  fs.mkdirSync(path.dirname(socketPath), { recursive: true });
  fs.rmSync(socketPath, { force: true });
  await app.listen(socketPath);
  console.log(`UnoComputer API listening on unix socket ${socketPath}`);
  console.log('Reachable through the admin at /api');
}

bootstrap();
