import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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

  async getClients(): Promise<any> {
    try {

      return await this.clientModel.aggregate([
        // Project to exclude orderIds
        {
          $project: {
            orderIds: 0, // Explicitly exclude orderIds
            __v: 0, // Also excluding version key as it's typically not needed
          },
        },
      ]);
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

  async searchClients(searchTerm: string): Promise<any> {
    try {
      // Check if searchTerm is empty
      if (!searchTerm || searchTerm.trim() === '') {
        throw new BadRequestException('Search term is required');
      }

      const results = await this.clientModel.aggregate([
        {
          $match: {
            $or: [
              { fullName: { $regex: searchTerm, $options: 'i' } }, // Case-insensitive regex search
              { phone: { $regex: searchTerm, $options: 'i' } },
            ],
            isDeleted: false, // Only non-deleted clients
          },
        },
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
            orderIds: 0,
            __v: 0,
            isDeleted: 0,
          },
        },
        // Sort by most recent first
        { $sort: { createdAt: -1 } },
        // Limit results if needed
        { $limit: 20 },
      ]);

      return {
        status: 'success',
        code: 200,
        data: results,
        message: 'تمت العملية بنجاح',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to search clients');
    }
  }
}
