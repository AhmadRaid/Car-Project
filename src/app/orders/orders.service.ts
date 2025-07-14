import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Orders, OrdersDocument } from 'src/schemas/orders.schema';
import { AddServicesToOrderDto, ServiceDto } from './dto/add-service.dto';
import { Client } from '@googlemaps/google-maps-services-js';
import { Invoice, InvoiceDocument } from 'src/schemas/invoice.schema';
import { ClientDocument } from 'src/schemas/client.schema';
import { CreateOrderForExistingClientDto } from './dto/add-order';
import { AddGuaranteeDto } from './dto/create-guarantee.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Client.name)
    private readonly clientModel: Model<ClientDocument>,
    @InjectModel(Orders.name)
    private readonly ordersModel: Model<OrdersDocument>,
    @InjectModel(Invoice.name)
    private readonly invoiceModel: Model<InvoiceDocument>,
  ) {}

  async createOrderForExistingClient(
    clientId: string,
    createOrderDto: any,
  ): Promise<{
    order: OrdersDocument;
    invoice?: InvoiceDocument;
  }> {
    try {
      this.validateCreateOrderDto(createOrderDto);

      const client = await this.findClientById(clientId);

      const order = await this.createOrder(client, createOrderDto);

      let invoice = null;
      if (order) {
        invoice = await this.createInvoice(client, order, createOrderDto);

        await this.ordersModel.findByIdAndUpdate(
          order._id,
          { $set: { invoiceId: invoice._id } },
          { new: true },
        );
      }

      return {
        order: order.toObject(),
        invoice: invoice?.toObject(),
      };
    } catch (error) {
      this.handleCreateOrderError(error);
    }
  }

  private validateCreateOrderDto(dto: any): void {
    // التحقق من وجود الخدمات
    if (!dto.services || dto.services.length === 0) {
      throw new BadRequestException('At least one service is required');
    }

    const requiredCarFields = [
      'carType',
      'carModel',
      'carColor',
      'carPlateNumber',
    ];

    const missingFields = requiredCarFields.filter((field) => !dto[field]);
    if (missingFields.length > 0) {
      throw new BadRequestException(
        `Car information is required when adding services. Missing fields: ${missingFields.join(', ')}`,
      );
    }

    // التحقق من صحة كل خدمة
    dto.services.forEach((service) => {
      if (!service.serviceType) {
        throw new BadRequestException(
          'Service type is required for each service',
        );
      }

      // التحقق من تاريخ الضمان إذا كان موجوداً
      if (service.guarantee) {
        const startDate = new Date(service.guarantee.startDate);
        const endDate = new Date(service.guarantee.endDate);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new BadRequestException('Invalid guarantee date format');
        }

        if (startDate > endDate) {
          throw new BadRequestException(
            'Guarantee start date cannot be after end date',
          );
        }
      }
    });
  }

  private async findClientById(clientId: string): Promise<ClientDocument> {
    const client = await this.clientModel.findById(clientId);
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    return client;
  }

  private async createOrder(
    client: ClientDocument,
    createOrderDto: any,
  ): Promise<OrdersDocument> {
    const preparedServices = this.prepareServices(createOrderDto.services);
    const orderData = this.buildOrderData(
      client,
      createOrderDto,
      preparedServices,
    );

    const createdOrder = await this.ordersModel.create(orderData);

    // تحديث العميل بإضافة معرف الطلب
    await this.clientModel.findByIdAndUpdate(
      client._id,
      { $push: { orderIds: createdOrder._id } },
      { new: true },
    );

    return createdOrder;
  }

  private async createInvoice(
    client: ClientDocument,
    order: OrdersDocument,
    createOrderDto: any,
  ): Promise<InvoiceDocument> {
    try {
      // حساب المبالغ المالية
      const subtotal = this.calculateSubtotal(createOrderDto.services);
      const taxRate = 5; // يمكن جعلها قابلة للتخصيص
      const taxAmount = subtotal * (taxRate / 100);
      const totalAmount = subtotal + taxAmount;

      // إنشاء الفاتورة
      const invoice = await this.invoiceModel.create({
        clientId: client._id,
        orderId: order._id,
        subtotal,
        taxRate,
        taxAmount,
        totalAmount,
        discount: 0,
        finalAmount: totalAmount - 0,
        notes: createOrderDto.invoiceNotes || '',
        status: 'pending',
      });

      return invoice;
    } catch (error) {
      console.error('Failed to create invoice:', error);
      throw new InternalServerErrorException('Failed to create invoice');
    }
  }

  private calculateSubtotal(services: ServiceDto[]): number {
    return services.reduce(
      (total, service) => total + (service.servicePrice || 50),
      0,
    );
  }

  private prepareServices(services: ServiceDto[]): any[] {
    if (!services) return [];

    return services.map((service) => {
      const preparedService: any = {
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
      };

      // إضافة حقول خاصة بالخدمة
      this.addServiceSpecificFields(preparedService, service);

      return preparedService;
    });
  }

  private addServiceSpecificFields(
    preparedService: any,
    service: ServiceDto,
  ): void {
    switch (service.serviceType) {
      case 'protection':
        preparedService.protectionFinish = service.protectionFinish;
        preparedService.protectionSize = service.protectionSize;
        preparedService.protectionCoverage = service.protectionCoverage;
        preparedService.originalCarColor = service.originalCarColor;
        preparedService.protectionColor = service.protectionColor;
        break;

      case 'insulator':
        preparedService.insulatorType = service.insulatorType;
        preparedService.insulatorCoverage = service.insulatorCoverage;
        break;

      case 'polish':
        preparedService.polishType = service.polishType;
        preparedService.polishSubType = service.polishSubType;
        break;

      case 'additions':
        preparedService.additionType = service.additionType;
        preparedService.washScope = service.washScope;
        break;
    }
  }

  private buildOrderData(
    client: ClientDocument,
    dto: CreateOrderForExistingClientDto,
    services: any[],
  ): any {
    return {
      clientId: client._id,
      carType: dto.carType,
      carModel: dto.carModel,
      carColor: dto.carColor,
      carPlateNumber: dto.carPlateNumber,
      carManufacturer: dto.carManufacturer,
      carSize: dto.carSize,
      services,
      status: 'pending',
      notes: dto.notes || '',
    };
  }

  private handleCreateOrderError(error: any): never {
    console.error('Error in createOrderForExistingClient:', error);

    if (error.code === 11000) {
      throw new ConflictException('Duplicate order data detected');
    }

    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(
        (err: any) => err.message,
      );
      throw new BadRequestException(
        `Validation failed: ${errorMessages.join(', ')}`,
      );
    }

    if (error.name === 'CastError') {
      throw new BadRequestException(
        `Invalid data type for field: ${error.path}`,
      );
    }

    if (
      error instanceof BadRequestException ||
      error instanceof NotFoundException
    ) {
      throw error;
    }

    if (
      error.message?.includes('invalid date') ||
      error.message?.includes('date format')
    ) {
      throw new BadRequestException(
        'Invalid date format. Please use YYYY-MM-DD format',
      );
    }

    throw new InternalServerErrorException(
      error.message || 'An unexpected error occurred while creating order',
    );
  }

  async findAll(): Promise<Orders[]> {
    const [result] = await this.ordersModel.aggregate([
      {
        $match: {
          isDeleted: false,
        },
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
    ]);

    if (!result) {
      throw new NotFoundException('Order not found');
    }

    return result;
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
          // استبدال clientId ببيانات العميل الكاملة
          clientId: '$client',
          // إضافة الحقول المطلوبة في المستوى الرئيسي
          clientName: {
            $concat: [
              '$client.firstName',
              ' ',
              '$client.middleName',
              ' ',
              '$client.lastName',
            ],
          },
          clientNumber: '$client.clientNumber',
        },
      },
      {
        $project: {
          client: 0, // إزالة حقل client المنفصل
          'clientId.__v': 0,
          'clientId.orderIds': 0,
          'clientId.isDeleted': 0,
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
