import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto';

export class ListWorkspacesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Absolute path of a folder' })
  @IsOptional()
  @IsString()
  directory?: string;
}
