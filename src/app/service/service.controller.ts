import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  NotFoundException,
  BadRequestException,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { ServicesService } from './service.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  async create(@Body() createServiceDto: CreateServiceDto) {
    try {
      return await this.servicesService.create(createServiceDto);

    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create service');
    }
  }

  @Get()
  async findAll() {
    return await this.servicesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.servicesService.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve service');
    }
  }

  @Put(':id')
  @UsePipes(new ValidationPipe())
  async update(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto
  ) {
    try {
      return await this.servicesService.update(id, updateServiceDto);
   
    } catch (error) {
      if (error instanceof NotFoundException || 
          error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to update service');
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.servicesService.remove(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete service');
    }
  }
}