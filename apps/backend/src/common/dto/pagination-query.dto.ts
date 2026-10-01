import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/** The default page size for every list endpoint, and the largest one allowed. */
export const DEFAULT_PAGE_SIZE = 100;
export const MAX_PAGE_SIZE = 100;

export class PaginationQueryDto {
  @ApiPropertyOptional({
    minimum: 1,
    default: 1,
    description: '1-based page number',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: MAX_PAGE_SIZE,
    default: DEFAULT_PAGE_SIZE,
    description:
      'Rows per page. Capped so one request cannot pull the whole table.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  pageSize: number = DEFAULT_PAGE_SIZE;
}

/** What every list endpoint returns. `items` is the page; `total` is the whole set. */
export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

/** Turns a validated query into Prisma's skip/take. */
export function toSkipTake({ page, pageSize }: PaginationQueryDto) {
  return { skip: (page - 1) * pageSize, take: pageSize };
}
