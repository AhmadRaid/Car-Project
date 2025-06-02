import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
  ConflictException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClientService } from './client.service';
import { generateUploadConfig } from 'src/config/upload.file.config';
import { JwtAuthGuard } from 'src/common/guards/jwtAuthGuard';

@Controller('clients')
//@UseGuards(JwtAuthGuard)
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  async createClient(
    @Body() createClientDto: any,
  ) {
    try {
      return await this.clientService.createClient({
        ...createClientDto,
      });

    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException('Client with this phone already exists');
      }
                console.log('errrrrrrrrrrrrrror',error);

      throw new BadRequestException('Failed to create client');
    }
  }

  @Get()
  async getAllClients(@Query('status') status?: any) {
    return this.clientService.getAllClients(status);
  }

  @Get(':id')
  async getClientById(@Param('id') id: string) {
    try {
      return await this.clientService.getClientById(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('Client not found');
      }
      throw new BadRequestException('Invalid client ID');
    }
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('image', generateUploadConfig('clients')))
  async updateClient(
    @Param('id') id: string,
    @Body() updateClientDto: any,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    try {
      return await this.clientService.updateClient(
        id,
        { ...updateClientDto, image: image?.path },
        image,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('Client not found');
      }
      if (error instanceof ConflictException) {
        throw new ConflictException('Email already exists');
      }
      throw new BadRequestException('Failed to update client');
    }
  }

  @Put(':id/status')
  async updateClientStatus(
    @Param('id') id: string,
    @Body('status') status: any,
  ) {
    try {
      return await this.clientService.updateClientStatus(id, status);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('Client not found');
      }
      throw new BadRequestException('Failed to update client status');
    }
  }

  @Delete(':id')
  async deleteClient(@Param('id') id: string) {
    try {
      return await this.clientService.deleteClient(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('Client not found');
      }
      throw new BadRequestException('Failed to delete client');
    }
  }
}