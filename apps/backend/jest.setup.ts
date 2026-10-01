import { Logger } from '@nestjs/common';

// Several tests drive deliberate failure paths (a rejecting Prisma client, a run that
// cannot be stopped). The services log those, correctly, which buries a green run under
// stack traces that look like breakage. Silence the output; tests that care about a log
// line spy on Logger.prototype directly, which still records.
Logger.overrideLogger(false);
