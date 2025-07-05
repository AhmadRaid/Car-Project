import { ClientDocument } from './../../schemas/client.schema';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaginationDto } from 'src/common/pagination-dto/pagination.dto';
import { Client } from 'src/schemas/client.schema';
import { Orders, OrdersDocument } from 'src/schemas/orders.schema';
import { createClientAndOrderDto, ServiceDto } from './dto/create-client.dto';

@Injectable()
export class ClientService {
  constructor(
    @InjectModel(Client.name) private clientModel: Model<ClientDocument>,
    @InjectModel(Orders.name) private ordersModel: Model<OrdersDocument>,
  ) {}

async createClient(
  createClientDto: createClientAndOrderDto,
): Promise<{ client: ClientDocument; order?: OrdersDocument }> {
  try {
    // 1. Create or find client
    let client = await this.clientModel.findOne({
      phone: createClientDto.phone,
    });

    if (!client) {
      client = await this.clientModel.create({
        firstName: createClientDto.firstName,
        middleName: createClientDto.middleName,
        lastName: createClientDto.lastName,
        email: createClientDto.email,
        phone: createClientDto.phone,
        clientType: createClientDto.clientType,
        branch: createClientDto.branch,
      });
    }

    // 2. Check if we should create an order
    const hasCarFields = createClientDto.carType && 
                        createClientDto.carModel && 
                        createClientDto.carColor && 
                        createClientDto.carPlateNumber && 
                        createClientDto.carManufacturer && 
                        createClientDto.carSize;

    let createdOrder: OrdersDocument | null = null;

    if (hasCarFields && createClientDto.services && createClientDto.services.length > 0) {
      // Prepare services
      const preparedServices = createClientDto.services.map((service) => ({
        serviceType: service.serviceType,
        dealDetails: service.dealDetails,
        servicePrice: service.servicePrice,
        guarantee: {
          typeGuarantee: service.guarantee.typeGuarantee,
          startDate: new Date(service.guarantee.startDate),
          endDate: new Date(service.guarantee.endDate),
          terms: service.guarantee.terms,
          notes: service.guarantee.notes,
          status: 'inactive',
          accepted: false,
        },
        // Add service-specific fields here
      }));

      // Create order
      createdOrder = await this.ordersModel.create({
        clientId: client._id,
        carType: createClientDto.carType,
        carModel: createClientDto.carModel,
        carColor: createClientDto.carColor,
        carPlateNumber: createClientDto.carPlateNumber,
        carManufacturer: createClientDto.carManufacturer,
        carSize: createClientDto.carSize,
        services: preparedServices,
      });

      // Update client with order reference
      await this.clientModel.findByIdAndUpdate(
        client._id,
        { $push: { orderIds: createdOrder._id } },
        { new: true }
      );
    }

    return {
      client: client.toObject(),
      order: createdOrder?.toObject(),
    };
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

  private addServiceSpecificFields(service: ServiceDto, serviceData: any) {
    switch (service.serviceType) {
      case 'protection':
        if (service.protectionFinish)
          serviceData.protectionFinish = service.protectionFinish;
        if (service.protectionSize)
          serviceData.protectionSize = service.protectionSize;
        if (service.protectionCoverage)
          serviceData.protectionCoverage = service.protectionCoverage;
        break;
      case 'insulator':
        if (service.insulatorType)
          serviceData.insulatorType = service.insulatorType;
        if (service.insulatorCoverage)
          serviceData.insulatorCoverage = service.insulatorCoverage;
        break;
      case 'polish':
        if (service.polishType) serviceData.polishType = service.polishType;
        if (service.polishSubType)
          serviceData.polishSubType = service.polishSubType;
        break;
      case 'additions':
        if (service.additionType)
          serviceData.additionType = service.additionType;
        if (service.washScope) serviceData.washScope = service.washScope;
        break;
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
      const { limit = 10, offset = 0, sort } = paginationDto;

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
              { $sort: { createdAt: -1 } }, // ترتيب الطلبات دائماً من الأحدث للأقدم
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
      ];

      // إضافة الترتيب حسب المعامل المطلوب
      if (sort?.key && sort?.order) {
        pipeline.push({
          $sort: {
            [sort.key]: sort.order === 'asc' ? 1 : -1,
          },
        });
      } else {
        // الترتيب الافتراضي إذا لم يتم تحديد ترتيب
        pipeline.push({ $sort: { createdAt: -1 } });
      }

      // Add search if term exists
      if (searchTerm?.trim()) {
        pipeline.unshift({
          $match: {
            $or: [
              { firstName: { $regex: searchTerm, $options: 'i' } },
              { middleName: { $regex: searchTerm, $options: 'i' } },
              { lastName: { $regex: searchTerm, $options: 'i' } },
              { phone: { $regex: searchTerm, $options: 'i' } },
              {
                $expr: {
                  $regexMatch: {
                    input: {
                      $concat: [
                        '$firstName',
                        ' ',
                        '$middleName',
                        ' ',
                        '$lastName',
                      ],
                    },
                    regex: searchTerm,
                    options: 'i',
                  },
                },
              },
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
      const countPipeline = [...pipeline];
      countPipeline.push({ $count: 'total' });
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
