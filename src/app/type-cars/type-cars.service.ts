import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CarSize, CarType, CarTypeDocument } from 'src/schemas/carTypes.schema';
import { CreateCarTypeDto } from './dto/create-car-type.dto';
import { PaginationDto } from 'src/common/pagination-dto/pagination.dto';

@Injectable()
export class CarTypeService {
  constructor(
    @InjectModel(CarType.name) private carTypeModel: Model<CarTypeDocument>,
  ) {}

  async create(createCarTypeDto: CreateCarTypeDto): Promise<CarType> {
    const createdCarType = new this.carTypeModel({
      ...createCarTypeDto,
    });
    return createdCarType.save();
  }

  async getCarTypes(
    searchTerm?: string,
    sizeTerm?: CarSize,
    manufacturerTerm?: string,
    isActiveTerm?: boolean,
    paginationDto?: PaginationDto,
  ) {
    try {
      const { limit = 10, offset = 0 } = paginationDto || {};

      // Validate pagination parameters
      if (limit < 1 || limit > 100) {
        throw new BadRequestException('Limit must be between 1 and 100');
      }
      if (offset < 0) {
        throw new BadRequestException('Offset must be positive');
      }

      // Base pipeline stages
      const pipeline: any[] = [
        { $match: { isDeleted: false } },

        { $sort: { createdAt: -1 } },
      ];

      // // Add search if term exists
      // if (searchTerm?.trim()) {
      //   pipeline.unshift({
      //     $match: {
      //       $or: [
      //         { name: { $regex: searchTerm, $options: 'i' } },
      //         { description: { $regex: searchTerm, $options: 'i' } },
      //         { manufacturer: { $regex: searchTerm, $options: 'i' } },
      //       ],
      //     },
      //   });
      // }

      // Add filters if they exist
      const filters: any = {};
      if (sizeTerm) {
        filters.size = sizeTerm;
      }
      if (manufacturerTerm) {
        filters.manufacturer = { $regex: new RegExp(manufacturerTerm, 'i') };
      }
      if (isActiveTerm !== undefined) {
        filters.isActive = isActiveTerm;
      }

      if (Object.keys(filters).length > 0) {
        pipeline.unshift({ $match: filters });
      }

      // Get total count
      const countPipeline = [...pipeline, { $count: 'total' }];
      const totalResult = await this.carTypeModel
        .aggregate(countPipeline)
        .exec();
      const totalCarTypes = totalResult[0]?.total || 0;

      // Add pagination
      const carTypes = await this.carTypeModel
        .aggregate([...pipeline, { $skip: offset }, { $limit: limit }])
        .exec();

      const currentPage = Math.floor(offset / limit) + 1 || 0;
      const totalPages = Math.ceil(totalCarTypes / limit) || 0;
      const nextPage = currentPage < totalPages ? currentPage + 1 : 0;

      return {
        pagination: {
          totalCarTypes,
          currentPage,
          totalPages,
          nextPage,
          limit: limit || 10,
          offset: offset || 0,
        },
        carTypes,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch car types');
    }
  }

  async findOne(id: string): Promise<CarType> {
    const carType = await this.carTypeModel
      .findOne({
        _id: id,
        isDeleted: false,
      })
      .exec();

    if (!carType) {
      throw new NotFoundException(`CarType with ID ${id} not found`);
    }
    return carType;
  }

  async update(
    id: string,
    updateCarTypeDto: CreateCarTypeDto,
  ): Promise<CarType> {
    const existingCarType = await this.carTypeModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        {
          ...updateCarTypeDto,
          updatedAt: new Date(),
        },
        { new: true },
      )
      .exec();

    if (!existingCarType) {
      throw new NotFoundException(`CarType with ID ${id} not found`);
    }
    return existingCarType;
  }

  async remove(id: string): Promise<CarType> {
    const deletedCarType = await this.carTypeModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        {
          isDeleted: true,
          updatedAt: new Date(),
        },
        { new: true },
      )
      .exec();

    if (!deletedCarType) {
      throw new NotFoundException(`CarType with ID ${id} not found`);
    }
    return deletedCarType;
  }

  async searchByName(name: string): Promise<CarType[]> {
    return this.carTypeModel
      .find({
        name: { $regex: name, $options: 'i' },
        isDeleted: false,
      })
      .limit(10)
      .exec();
  }
}
