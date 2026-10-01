import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Type } from '@nestjs/common';
import { createValidationPipe } from '../validation';

/**
 * Boots a controller over real HTTP with the real DTOs and the real global pipe, so a
 * test sees exactly what a caller sees - status codes included. Only the service layer
 * is faked.
 *
 * The global prefix matches main.ts, so paths here read like the URLs the admin proxies.
 */
export async function createHttpTestApp(options: {
  controllers: Type<unknown>[];
  providers: { provide: Type<unknown>; useValue: unknown }[];
}): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    controllers: options.controllers,
    providers: options.providers,
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(createValidationPipe());
  await app.init();
  return app;
}

/** An empty page, the shape every list endpoint returns. */
export const emptyPage = (page = 1, pageSize = 100) => ({
  items: [],
  total: 0,
  page,
  pageSize,
});
