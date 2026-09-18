import { IsString, IsOptional, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiProperty({
    description: 'Workspace the session belongs to',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsString()
  @Matches(/^[a-f0-9-]+$/, { message: 'workspaceId must be a valid UUID format' })
  workspaceId!: string;

  @ApiProperty({
    description: 'Optional label. Runs still address the session by id.',
    required: false,
    example: 'implement-login'
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string;
}
