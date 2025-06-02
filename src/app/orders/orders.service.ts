import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Orders, OrdersDocument } from 'src/schemas/orders.schema';
import { AddGuaranteeDto } from './dto/create-guarantee.dto';

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

  async findAll(filter?: {
    clientId?: string;
    guaranteeType?: string;
  }): Promise<Orders[]> {
    const query: any = { isDeleted: false };

    if (filter?.clientId) {
      query.clientId = new Types.ObjectId(filter.clientId);
    }

    if (filter?.guaranteeType) {
      query['guarantee.type'] = filter.guaranteeType;
    }

    return this.ordersModel.find(query).exec();
  }

  async findOne(id: string): Promise<Orders> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid order ID');
    }

    const order = await this.ordersModel.findOne({
      _id: new Types.ObjectId(id),
      isDeleted: false,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
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

  // async checkGuaranteeValidity(orderId: string): Promise<boolean> {
  //   const order = await this.findOne(orderId);
  //   const today = new Date();
  //   return (
  //     order.guarantee.startDate <= today && order.guarantee.endDate >= today
  //   );
  // }

  async manuallyUpdateGuaranteeStatus(
    orderId: string,
    guaranteeIndex: number,
    newStatus: 'active' | 'inactive',
  ): Promise<OrdersDocument> {
    try {
      // Validate orderId
      if (!Types.ObjectId.isValid(orderId)) {
        throw new BadRequestException('Invalid order ID');
      }

      // Validate status
      if (newStatus !== 'active' && newStatus !== 'inactive') {
        throw new BadRequestException(
          'Status must be either "active" or "inactive"',
        );
      }

      const order = await this.ordersModel.findById(orderId);
      if (!order) {
        throw new NotFoundException('Order not found');
      }

      const guarantees = order.guarantee as Array<any>; // Type assertion
      if (!guarantees || guarantees.length === 0) {
        throw new BadRequestException('This order has no guarantees');
      }

      // Validate guarantee index
      if (
        !Number.isInteger(guaranteeIndex) ||
        guaranteeIndex < 0 ||
        guaranteeIndex >= order.guarantee.length
      ) {
        throw new BadRequestException('Invalid guarantee index');
      }

      // Update status for the specific guarantee
      const updatedOrder = await this.ordersModel.findByIdAndUpdate(
        orderId,
        {
          $set: {
            [`guarantee.${guaranteeIndex}.status`]: newStatus,
          },
        },
        { new: true },
      );

      if (!updatedOrder) {
        throw new NotFoundException('Order not found after update');
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
    today.setHours(0, 0, 0, 0); // Compare dates without time component

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

    // Validate the order exists and isn't deleted
    const order = await this.ordersModel.findOne({
      _id: orderId,
      isDeleted: false,
    });
    if (!order) {
      throw new BadRequestException('Order not found or has been deleted');
    }

    // Prepare the guarantee object
    const newGuarantee = {
      ...guaranteeData,
      status: 'active', // Since we validated dates are in future
    };

    // Update the order with the new guarantee
    const updatedOrder = await this.ordersModel.findByIdAndUpdate(
      orderId,
      {
        $push: { guarantee: newGuarantee }, // Use $push to add to array
      },
      { new: true }, // Return the updated document
    );

    return updatedOrder;
  }
}
