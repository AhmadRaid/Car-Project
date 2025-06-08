import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Service } from 'src/schemas/service.schema';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel(Service.name) private serviceModel: Model<Service>,
  ) {}

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    try {
      const createdService = new this.serviceModel(createServiceDto);
      return await createdService.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException('Service name already exists');
      }
      throw new BadRequestException('Failed to create service');
    }
  }

  async findAll(): Promise<Service[]> {
    return this.serviceModel.find({ isDeleted: false }).exec();
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.serviceModel.findOne({ 
      _id: id, 
      isDeleted: false 
    }).exec();
    
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    return service;
  }

  async update(id: string, updateServiceDto: UpdateServiceDto): Promise<Service> {
    try {
      const updatedService = await this.serviceModel.findByIdAndUpdate(
        id,
        updateServiceDto,
        { new: true }
      ).exec();

      if (!updatedService) {
        throw new NotFoundException('Service not found');
      }
      return updatedService;
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException('Service name already exists');
      }
      throw new BadRequestException('Failed to update service');
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.serviceModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    ).exec();

    if (!result) {
      throw new NotFoundException('Service not found');
    }
    return { message: 'Service deleted successfully' };
  }
}