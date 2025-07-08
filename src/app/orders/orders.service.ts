import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Orders, OrdersDocument } from 'src/schemas/orders.schema';
import { AddGuaranteeDto } from './dto/create-guarantee.dto';
import { AddServicesToOrderDto } from './dto/add-service.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Orders.name) private ordersModel: Model<OrdersDocument>,
  ) {}

  async create(createOrderDto: any): Promise<Orders> {
    try {
      const createdOrder = new this.ordersModel(createOrderDto);
      return await createdOrder.save();
    } catch (error) {
      throw new BadRequestException('Failed to create order');
    }
  }

  async findAll(): Promise<Orders[]> {
    const query: any = { isDeleted: false };

    return this.ordersModel.find(query).exec();
  }

  async findOne(id: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid order ID');
    }

    const [result] = await this.ordersModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(id),
          isDeleted: false,
        },
      },
      {
        $limit: 1,
      },
      {
        $lookup: {
          from: 'clients',
          localField: 'clientId',
          foreignField: '_id',
          as: 'client',
        },
      },
      {
        $unwind: {
          path: '$client',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          clientNumber: '$client.clientNumber',
          clientName: {
            $concat: [
              '$client.firstName',
              ' ',
              '$client.middleName',
              ' ',
              '$client.lastName',
            ],
          },
        },
      },
      {
        $project: {
          client: 0,
          __v:0,
          isDeleted:0
        },
      },
    ]);

    if (!result) {
      throw new NotFoundException('Order not found');
    }

    return result;
  }

  async update(id: string, updateOrderDto: any): Promise<Orders> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid order ID');
    }

    const updatedOrder = await this.ordersModel.findByIdAndUpdate(
      new Types.ObjectId(id),
      { $set: updateOrderDto },
      { new: true },
    );

    if (!updatedOrder) {
      throw new NotFoundException('Order not found');
    }

    return updatedOrder;
  }

  async remove(id: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid order ID');
    }

    const result = await this.ordersModel.findByIdAndUpdate(
      new Types.ObjectId(id),
      { isDeleted: true },
      { new: true },
    );

    if (!result) {
      throw new NotFoundException('Order not found');
    }

    return { message: 'Order deleted successfully' };
  }

  async findByClient(clientId: string): Promise<Orders[]> {
    return this.ordersModel.find({
      clientId: new Types.ObjectId(clientId),
      isDeleted: false,
    });
  }

  async findActiveGuarantees(): Promise<Orders[]> {
    const today = new Date();
    return this.ordersModel.find({
      'guarantee.endDate': { $gte: today },
      isDeleted: false,
    });
  }

  async manuallyUpdateGuaranteeStatus(
    orderId: string,
    guaranteeId: string,
    newStatus: 'active' | 'inactive',
  ): Promise<OrdersDocument> {
    try {
      // Validate orderId
      if (!Types.ObjectId.isValid(orderId)) {
        throw new BadRequestException('Invalid order ID');
      }

      // Validate guaranteeId
      if (!Types.ObjectId.isValid(guaranteeId)) {
        throw new BadRequestException('Invalid guarantee ID');
      }

      // Validate status
      if (newStatus !== 'active' && newStatus !== 'inactive') {
        throw new BadRequestException(
          'Status must be either "active" or "inactive"',
        );
      }

      // Check if order exists (optional - the update will fail if not)
      const orderExists = await this.ordersModel.exists({ _id: orderId });
      if (!orderExists) {
        throw new NotFoundException('Order not found');
      }

      // Atomic update using the guarantee _id
      const updatedOrder = await this.ordersModel.findOneAndUpdate(
        {
          _id: orderId,
          'guarantee._id': guaranteeId,
        },
        {
          $set: {
            'guarantee.$.status': newStatus,
          },
        },
        { new: true, runValidators: true },
      );

      if (!updatedOrder) {
        throw new NotFoundException(
          'Order not found or guarantee with specified ID does not exist',
        );
      }

      return updatedOrder;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to update guarantee status');
    }
  }

  async addGuaranteeToOrder(
    orderId: string,
    guaranteeData: AddGuaranteeDto,
  ): Promise<Orders> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Validate the dates
    if (guaranteeData.endDate <= guaranteeData.startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    if (guaranteeData.startDate < today) {
      throw new BadRequestException(
        'Start date must be today or in the future',
      );
    }

    if (guaranteeData.endDate < today) {
      throw new BadRequestException('End date must be in the future');
    }

    const order = await this.ordersModel.findOne({
      _id: orderId,
      isDeleted: false,
    });
    if (!order) {
      throw new BadRequestException('Order not found or has been deleted');
    }

    const newGuarantee = {
      ...guaranteeData,
      status: 'active',
    };

    const updatedOrder = await this.ordersModel.findByIdAndUpdate(
      orderId,
      {
        $push: { guarantee: newGuarantee },
      },
      { new: true },
    );

    return updatedOrder;
  }

  async updateGuaranteeAcceptance(
    orderId: string,
    guaranteeId: string,
    accepted: boolean,
  ) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid Order ID');
    }
    if (!Types.ObjectId.isValid(guaranteeId)) {
      throw new BadRequestException('Invalid Guarantee ID');
    }

    const result = await this.ordersModel.findOneAndUpdate(
      {
        _id: orderId,
        'guarantee._id': guaranteeId,
      },
      {
        $set: {
          'guarantee.$.accepted': accepted,
          'guarantee.$.status': accepted ? 'active' : 'inactive',
        },
      },
      { new: true, runValidators: true },
    );

    if (!result) {
      throw new NotFoundException(
        'Order or guarantee not found. Either the order does not exist or the guarantee ID is incorrect.',
      );
    }

    return result;
  }

  async addServicesToOrder(addServicesDto: AddServicesToOrderDto) {
    try {
      // Validate order ID
      if (!Types.ObjectId.isValid(addServicesDto.orderId)) {
        throw new BadRequestException('Invalid order ID format');
      }

      // Find the order
      const order = await this.ordersModel.findById(addServicesDto.orderId);
      if (!order) {
        throw new NotFoundException('Order not found');
      }

      // Prepare and add all new services
      const newServices = addServicesDto.services.map((serviceDto) => {
        const service: any = {
          _id: new Types.ObjectId(),
          serviceType: serviceDto.serviceType,
          dealDetails: serviceDto.dealDetails,
          servicePrice: serviceDto.servicePrice,
          guarantee: {
            typeGuarantee: serviceDto.guarantee.typeGuarantee,
            startDate: new Date(serviceDto.guarantee.startDate),
            endDate: new Date(serviceDto.guarantee.endDate),
            terms: serviceDto.guarantee.terms,
            notes: serviceDto.guarantee.notes,
            status: 'inactive',
            accepted: false,
          },
        };

        // Add service-specific fields based on service type
        switch (serviceDto.serviceType) {
          case 'protection':
            service.protectionFinish = serviceDto.protectionFinish;
            service.protectionSize = serviceDto.protectionSize;
            service.protectionCoverage = serviceDto.protectionCoverage;
            service.originalCarColor = serviceDto.originalCarColor;
            service.protectionColor = serviceDto.protectionColor;
            break;

          case 'insulator':
            service.insulatorType = serviceDto.insulatorType;
            service.insulatorCoverage = serviceDto.insulatorCoverage;
            break;

          case 'polish':
            service.polishType = serviceDto.polishType;
            service.polishSubType = serviceDto.polishSubType;
            break;

          case 'additions':
            service.additionType = serviceDto.additionType;
            service.washScope = serviceDto.washScope;
            break;
        }

        return service;
      });

      // Add all services to the order
      order.services.push(...newServices);
      const updatedOrder = await order.save();

      return {
        success: true,
        message: `${newServices.length} service(s) added successfully`,
        order: updatedOrder.toObject(),
      };
    } catch (error) {
      console.error('Error adding services:', error);

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      // Handle specific MongoDB errors
      if (error.name === 'ValidationError') {
        const errorMessages = Object.values(error.errors).map(
          (err: any) => err.message,
        );
        throw new BadRequestException(
          `Validation failed: ${errorMessages.join(', ')}`,
        );
      }

      throw new BadRequestException(
        error.message || 'Failed to add services to order',
      );
    }
  }
}
