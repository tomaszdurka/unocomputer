import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RunsModule } from './runs/runs.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { SessionsModule } from './sessions/sessions.module';
import { PromptsModule } from './prompts/prompts.module';
import { PrismaModule } from './prisma/prisma.module';
import { PersistenceModule } from './database/persistence.module';
import { LifecycleService } from './lifecycle.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    PersistenceModule,
    RunsModule,
    WorkspacesModule,
    SessionsModule,
    PromptsModule,
  ],
  providers: [LifecycleService],
})
export class AppModule {}
