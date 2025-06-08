import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaginationDto } from 'src/common/pagination-dto/pagination.dto';
import { uploadStorageFile } from 'src/config/firebase.config';
import { Client, ClientDocument } from 'src/schemas/client.schema';
import { Orders, OrdersDocument } from 'src/schemas/orders.schema';

@Injectable()
export class ClientService {
  constructor(
    @InjectModel(Client.name) private clientModel: Model<ClientDocument>,
    @InjectModel(Orders.name) private ordersModel: Model<OrdersDocument>,
  ) {}

  async createClient(createClientDto: any): Promise<Client> {
    try {
      // Check if client already exists
      const existingClient = await this.clientModel.findOne({
        phone: createClientDto.phone,
      });

      let clientId;
      let client;

      if (!existingClient) {
        client = await this.clientModel.create(createClientDto);
        clientId = client._id;
      } else {
        clientId = existingClient._id;
        client = existingClient;
      }

      const createdOrder = await this.ordersModel.create({
        clientId: new Types.ObjectId(clientId),
        carModel: createClientDto.carModel,
        carColor: createClientDto.carColor,
        service: createClientDto.service,
        guarantee: [
          {
            products: createClientDto.guarantee.products,
            typeGuarantee: createClientDto.guarantee.typeGuarantee,
            startDate: createClientDto.guarantee.startDate,
            endDate: createClientDto.guarantee.endDate,
            terms: createClientDto.guarantee.terms,
            coveredComponents: createClientDto.guarantee.coveredComponents,
          },
        ],
      });

      await this.clientModel.findByIdAndUpdate(
        clientId,
        { $push: { orderIds: createdOrder._id } },
        { new: true },
      );

      return client;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to create client');
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

      return {
        status: 'success',
        code: 200,
        data: result[0],
        message: 'تمت العملية بنجاح',
      };
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

  async getClients(paginationDto: PaginationDto) {
    try {
      const { limit = 10, offset = 0, searchTerm } = paginationDto;

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

      // Get total count
      const countPipeline = [...pipeline, { $count: 'total' }];
      const totalResult = await this.clientModel.aggregate(countPipeline).exec();
      const total = totalResult[0]?.total || 0;

      // Add pagination
      const results = await this.clientModel.aggregate([
        ...pipeline,
        { $skip: offset },
        { $limit: limit },
      ]).exec();

      return {
          clients: results,
          pagination: {
            total,
            limit,
            offset,
          },
        }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch clients');
    }
  }
}
