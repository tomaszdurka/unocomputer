import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';

// The backend is not exposed on a TCP port. It listens on a unix domain socket and the
// admin proxies /api/* to it, so the browser only ever talks to the admin's single port.
// Set PORT to listen on 127.0.0.1:<port> instead (debugging escape hatch).
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
    operationIdFactory: (controllerKey: string, methodKey: string, version?: string) => methodKey,
  });
  // The API root serves its own docs: /api -> swagger UI, /api/openapi.json -> raw spec.
  SwaggerModule.setup('api', app, document, {
    jsonDocumentUrl: 'api/openapi.json',
  });

  // Ensure data directory exists and update schema
  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'unocomputer.db');
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const orm = app.get(MikroORM);
  await orm.getSchemaGenerator().updateSchema();

  if (process.env.PORT) {
    await app.listen(process.env.PORT, '127.0.0.1');
    console.log(`UnoComputer API listening on 127.0.0.1:${process.env.PORT}`);
    console.log(`Swagger documentation at http://127.0.0.1:${process.env.PORT}/api`);
  } else {
    const socketPath = process.env.SOCKET_PATH ?? defaultSocketPath;
    fs.mkdirSync(path.dirname(socketPath), { recursive: true });
    fs.rmSync(socketPath, { force: true });
    await app.listen(socketPath);
    console.log(`UnoComputer API listening on unix socket ${socketPath}`);
    console.log('Reachable through the admin at /api');
  }
}

bootstrap();
