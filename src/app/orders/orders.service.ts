import {
    Injectable,
    NotFoundException,
    BadRequestException,
  } from '@nestjs/common';
  import { InjectModel } from '@nestjs/mongoose';
  import { Model, Types } from 'mongoose';
import { Orders, OrdersDocument } from 'src/schemas/orders.schema';
  
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
  
    async checkGuaranteeValidity(orderId: string): Promise<boolean> {
      const order = await this.findOne(orderId);
      const today = new Date();
      return (
        order.guarantee.startDate <= today && order.guarantee.endDate >= today
      );
    }
  }