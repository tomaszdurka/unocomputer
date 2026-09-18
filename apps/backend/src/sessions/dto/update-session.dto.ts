import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSessionDto {
  @ApiProperty({
    description: 'Session label; null clears it',
    required: false,
    nullable: true,
    example: 'implement-login'
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string | null;
}
