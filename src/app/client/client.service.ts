import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaginationDto } from 'src/common/pagination-dto/pagination.dto';
import { ClientDocument } from 'src/schemas/client.schema';
import { Orders, OrdersDocument } from 'src/schemas/orders.schema';
import { CreateClientDto } from './dto/create-client.dto';

import { ClientType } from 'src/common/enum/clientType.enum';

export interface Client {
  _id: Types.ObjectId;
  firstName: string;
  middleName: string;
  lastName: string;
  email?: string;
  clientType?: ClientType;
  phone: string;
  orderIds: Types.ObjectId[];
  company?: string;
  branch: 'عملاء فرع ابحر' | 'عملاء فرع المدينة' | 'اخرى';
  address?: string;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable()
export class ClientService {
  constructor(
    @InjectModel('Client') private clientModel: Model<ClientDocument>,
    @InjectModel(Orders.name) private ordersModel: Model<OrdersDocument>,
  ) {}

  async createClient(createClientDto: any): Promise<ClientDocument> {
    try {
      const existingClient = await this.clientModel.findOne({
        phone: createClientDto.phone,
      });

      let client: ClientDocument;

      if (!existingClient) {
        client = await this.clientModel.create(createClientDto);
      } else {
        client = existingClient;
      }

      if (
        !createClientDto.carType &&
        !createClientDto.carModel &&
        !createClientDto.carColor &&
        !createClientDto.carPlateNumber &&
        !createClientDto.guarantee
      ) {
        console.log('✅ تم تسجيل العميل بدون Order');
        return client;
      }

      const createdOrder = await this.ordersModel.create({
        clientId: client._id,
        carType: createClientDto.carType,
        carModel: createClientDto.carModel,
        carColor: createClientDto.carColor,
        carPlateNumber: createClientDto.carPlateNumber,
        carManufacturer: createClientDto.carManufacturer,
        carSize: createClientDto.carSize,
        guarantee: createClientDto.guarantee
          ? [
              {
                typeGuarantee: createClientDto.guarantee.typeGuarantee,
                startDate: createClientDto.guarantee.startDate,
                endDate: createClientDto.guarantee.endDate,
                terms: createClientDto.guarantee.terms,
                notes: createClientDto.guarantee.notes,
              },
            ]
          : [],
      });

      await this.clientModel.findByIdAndUpdate(
        client._id,
        { $push: { orderIds: createdOrder._id } },
        { new: true },
      );

      return client;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('فشل في إنشاء العميل');
    }
  }

  async getClientWithOrders(clientId: string): Promise<any> {
    try {
      // Validate clientId
      if (!Types.ObjectId.isValid(clientId)) {
        throw new BadRequestException('Invalid client ID');
      }

      const result = await this.clientModel.aggregate([
        // Match the client by ID
        { $match: { _id: new Types.ObjectId(clientId) } },

        // Lookup to join with orders collection
        {
          $lookup: {
            from: 'orders',
            localField: 'orderIds',
            foreignField: '_id',
            as: 'orders',
            pipeline: [
              { $match: { isDeleted: false } },
              { $sort: { createdAt: -1 } },
              { $project: { isDeleted: 0, __v: 0 } },
            ],
          },
        },

        // Add computed fields
        {
          $addFields: {
            orderStats: {
              totalOrders: { $size: '$orders' },
              activeGuarantees: {
                $size: {
                  $filter: {
                    input: '$orders',
                    as: 'order',
                    cond: { $gt: ['$$order.guarantee.endDate', new Date()] },
                  },
                },
              },
            },
          },
        },

        // Project to exclude orderIds
        {
          $project: {
            orderIds: 0, // Explicitly exclude orderIds
            __v: 0, // Also excluding version key as it's typically not needed
          },
        },
      ]);

      if (!result || result.length === 0) {
        throw new NotFoundException('Client not found');
      }

      return result[0];
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch client data');
    }
  }

  async getClients(
    branchTerm: 'عملاء فرع ابحر' | 'عملاء فرع المدينة' | 'اخرى',
    searchTerm: string,
    paginationDto: PaginationDto,
  ) {
    try {
      const { limit = 10, offset = 0 } = paginationDto;

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
        {
          $lookup: {
            from: 'orders',
            localField: 'orderIds',
            foreignField: '_id',
            as: 'orders',
            pipeline: [
              { $match: { isDeleted: false } },
              { $sort: { createdAt: -1 } },
              { $project: { isDeleted: 0, __v: 0 } },
            ],
          },
        },
        {
          $addFields: {
            orderStats: {
              totalOrders: { $size: '$orders' },
              activeGuarantees: {
                $size: {
                  $filter: {
                    input: '$orders',
                    as: 'order',
                    cond: { $gt: ['$$order.guarantee.endDate', new Date()] },
                  },
                },
              },
            },
          },
        },
        {
          $project: {
            orderIds: 0,
            __v: 0,
            isDeleted: 0,
          },
        },
        { $sort: { createdAt: -1 } },
      ];

      // Add search if term exists
      if (searchTerm?.trim()) {
        pipeline.unshift({
          $match: {
            $or: [
              { fullName: { $regex: searchTerm, $options: 'i' } },
              { phone: { $regex: searchTerm, $options: 'i' } },
            ],
          },
        });
      }

      if (branchTerm) {
        pipeline.unshift({
          $match: {
            branch: {
              $regex: new RegExp(`^${branchTerm}$`, 'i'),
            },
          },
        });
      }

      // Get total count
      const countPipeline = [...pipeline, { $count: 'total' }];
      const totalResult = await this.clientModel
        .aggregate(countPipeline)
        .exec();
      const totalClients = totalResult[0]?.total || 0;

      // Add pagination
      const clients = await this.clientModel
        .aggregate([...pipeline, { $skip: offset }, { $limit: limit }])
        .exec();

      const currentPage = Math.floor(offset / limit) + 1 || 0;
      const totalPages = Math.ceil(totalClients / limit) || 0;
      const nextPage = currentPage < totalPages ? currentPage + 1 : 0;

      return {
        pagination: {
          totalClients,
          currentPage,
          totalPages,
          nextPage,
          limit: limit || 10,
          offset: offset || 0,
        },
        clients,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch clients');
    }
  }
}
