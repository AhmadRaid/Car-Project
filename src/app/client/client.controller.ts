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
import { createClientAndOrderDto } from './dto/create-client.dto';

@Controller('clients')
//@UseGuards(JwtAuthGuard)
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  async createClient(@Body() createClientDto: createClientAndOrderDto) {
    try {
      return await this.clientService.createClient({
        ...createClientDto,
      });
    } catch (error) {
      console.error('Error creating order:', error);

      // Handle specific error types
      if (error.code === 11000) {
        throw new ConflictException(
          'Client with this phone number already exists',
        );
      }

      if (error.name === 'ValidationError') {
        // Handle Mongoose validation errors
        const errorMessages = Object.values(error.errors).map(
          (err: any) => err.message,
        );
        throw new BadRequestException(
          `Validation failed: ${errorMessages.join(', ')}`,
        );
      }

      if (error.name === 'CastError') {
        // Handle invalid data type errors
        throw new BadRequestException(
          `Invalid data type for field: ${error.path}`,
        );
      }

      if (error instanceof Error && error.message.includes('required')) {
        // Handle missing required fields
        throw new BadRequestException(error.message);
      }

      // For date validation errors
      if (
        error.message.includes('invalid date') ||
        error.message.includes('date format')
      ) {
        throw new BadRequestException(
          'Invalid date format. Please use YYYY-MM-DD format',
        );
      }

      // General error as last resort
      throw new BadRequestException(
        `Failed to create order: ${error.message || 'Unknown error occurred'}`,
      );
    }
  }

  @Get(':clientId')
  async getClientWithOrders(@Param('clientId') clientId: string) {
    return this.clientService.getClientWithOrders(clientId);
  }

  @Get()
  async getClients(
    @Query('search') searchTerm?: string,
    @Query('branch')
    branchTerm?: 'عملاء فرع ابحر' | 'عملاء فرع المدينة' | 'اخرى',
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('sort') sortOrder?: 'asc' | 'desc', // إضافة معامل الترتيب
    @Query('sortBy') sortBy?: string, // إضافة معامل الحقل الذي نريد الترتيب حسبه
  ) {
    
    try {
      if (limit < 1 || limit > 100) {
        throw new BadRequestException('Limit must be between 1 and 100');
      }
      if (offset < 0) {
        throw new BadRequestException('Offset must be positive');
      }

      const paginationDto: PaginationDto = {
        offset,
        limit,
        sort: {
          order: sortOrder || 'desc', // القيمة الافتراضية 'desc' للأحدث أولاً
          key: sortBy || 'createdAt', // القيمة الافتراضية 'createdAt'
        },
      };

      return await this.clientService.getClients(
        branchTerm,
        searchTerm,
        paginationDto,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to process client request');
    }
  }
}
