import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  BadRequestException,
  ConflictException,
  Patch,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ClientService } from './client.service';
import { PaginationDto } from 'src/common/pagination-dto/pagination.dto';

@Controller('clients')
//@UseGuards(JwtAuthGuard)
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  async createClient(@Body() createClientDto: any) {
    try {
      return await this.clientService.createClient({
        ...createClientDto,
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException('Client with this phone already exists');
      }

      throw new BadRequestException('Failed to create client');
    }
  }



  @Get(':clientId')
  async getClientWithOrders(@Param('clientId') clientId: string) {
    return this.clientService.getClientWithOrders(clientId);
  }


@Get()
async getClients(
  @Query('search') searchTerm?: string,
  @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
) {
  try {
    if (limit < 1 || limit > 100) {
      throw new BadRequestException('Limit must be between 1 and 100');
    }
    if (offset < 0) {
      throw new BadRequestException('Offset must be positive');
    }

    const paginationDto: PaginationDto = {
      searchTerm,
      offset,
      limit,
    };

    return await this.clientService.getClients(paginationDto);
  } catch (error) {
    if (error instanceof BadRequestException) {
      throw error;
    }
    throw new BadRequestException('Failed to process client request');
  }
}

}
