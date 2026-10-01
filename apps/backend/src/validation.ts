import { ValidationPipe } from '@nestjs/common';

// The single definition of request validation, shared by the running server (main.ts)
// and the controller tests.
//
// forbidNonWhitelisted is the sharp edge. Any query parameter a DTO does not declare
// makes the entire request 400, so adding a filter to a controller without adding the
// property to its DTO silently breaks every caller that uses that filter - while an
// unfiltered request keeps working, which is exactly what a smoke test checks. This has
// already happened once here, when pagination was introduced and `tag`, `status` and
// `directory` stopped being accepted.
//
// Tests must run the same pipe the server runs. A test that constructs its own
// ValidationPipe can drift from this one and prove nothing.
export const createValidationPipe = () =>
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });
