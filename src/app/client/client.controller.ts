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
} from '@nestjs/common';
import { ClientService } from './client.service';

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

  @Get('search')
  async searchClients(@Query('nameOrPhone') searchTerm: string) {
    return this.clientService.searchClients(searchTerm);
  }

  @Get(':clientId')
  async getClientWithOrders(@Param('clientId') clientId: string) {
    return this.clientService.getClientWithOrders(clientId);
  }

  @Get()
  async getClients() {
    return this.clientService.getClients();
  }
}
