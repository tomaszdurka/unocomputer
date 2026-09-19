import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQueryDto } from '../../common/dto';
import { RUN_STATUSES } from '../../database/run-status';

// Every query parameter an endpoint accepts has to be declared on one DTO: the global
// ValidationPipe runs with forbidNonWhitelisted, so a parameter that is merely read with
// @Query('name') and not declared here is rejected as "property name should not exist".

export class ListRunsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    isArray: true,
    type: String,
    description: 'Repeatable. Runs must carry every tag given.',
  })
  @IsOptional()
  // One `?tag=` arrives as a string, several as an array; callers downstream want a list.
  @Transform(({ value }) => (value === undefined ? [] : Array.isArray(value) ? value : [value]))
  tag: string[] = [];

  @ApiPropertyOptional({ enum: RUN_STATUSES })
  @IsOptional()
  @IsIn(RUN_STATUSES)
  status?: string;
}
