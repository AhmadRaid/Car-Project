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
import { createClientAndOrderDto } from './dto/create-client.dto';
import { ServiceDto } from './dto/service.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { AddServicesToOrderDto } from '../orders/dto/add-service.dto';
import { Invoice, InvoiceDocument } from 'src/schemas/invoice.schema';

@Injectable()
export class ClientService {
  constructor(
    @InjectModel(Client.name) private clientModel: Model<ClientDocument>,
    @InjectModel(Orders.name) private ordersModel: Model<OrdersDocument>,
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
  ) {}

  /**
   * إنشاء عميل جديد مع طلب وفاتورة إذا لزم الأمر
   * @param createClientDto بيانات إنشاء العميل والطلب
   * @returns كائن يحتوي على العميل والطلب والفاتورة (إذا تم إنشاؤها)
   */
  async createClient(createClientDto: createClientAndOrderDto): Promise<{
    client: ClientDocument;
    order?: OrdersDocument;
    invoice?: InvoiceDocument;
  }> {
    try {
      // التحقق من صحة البيانات المدخلة
      this.validateCreateClientDto(createClientDto);

      // 1. إنشاء أو العثور على العميل
      const client = await this.findOrCreateClient(createClientDto);

      // 2. إنشاء الطلب إذا لزم الأمر
      const order = await this.maybeCreateOrder(client, createClientDto);

      // 3. إنشاء الفاتورة إذا تم إنشاء طلب
      let invoice = null;
      if (order) {
        invoice = await this.createInvoice(client, order, createClientDto);

        // تحديث الطلب برقم الفاتورة
        await this.ordersModel.findByIdAndUpdate(
          order._id,
          { $set: { invoiceId: invoice._id } },
          { new: true },
        );
      }

      return {
        client: client.toObject(),
        order: order?.toObject(),
        invoice: invoice?.toObject(),
      };
    } catch (error) {
      this.handleCreateClientError(error);
    }
  }

  /**
   * التحقق من صحة بيانات إنشاء العميل
   * @param dto بيانات إنشاء العميل
   * @throws BadRequestException إذا كانت البيانات غير صالحة
   */
  private validateCreateClientDto(dto: createClientAndOrderDto): void {
    // التحقق من وجود بيانات العميل الأساسية
    if (!dto.phone || !dto.firstName || !dto.lastName) {
      throw new BadRequestException(
        'Phone, first name and last name are required',
      );
    }

    // إذا كانت هناك خدمات، يجب التحقق من بيانات السيارة
    if (dto.services && dto.services.length > 0) {
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

        // if (service.servicePrice === undefined || service.servicePrice < 0) {
        //   throw new BadRequestException(
        //     'Valid service price is required for each service',
        //   );
        // }

        // التحقق من تاريخ الضمان
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
  }

  /**
   * إنشاء فاتورة جديدة
   * @param client بيانات العميل
   * @param order بيانات الطلب
   * @param createClientDto بيانات إنشاء العميل
   * @returns وثيقة الفاتورة
   */
  private async createInvoice(
    client: ClientDocument,
    order: OrdersDocument,
    createClientDto: createClientAndOrderDto,
  ): Promise<InvoiceDocument> {
    try {
      // حساب المبالغ المالية
      const subtotal = this.calculateSubtotal(createClientDto.services);
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
        notes: createClientDto.invoiceNotes || '',
        status: 'pending',
      });

      return invoice;
    } catch (error) {
      console.error('Failed to create invoice:', error);
      throw new InternalServerErrorException('Failed to create invoice');
    }
  }

  /**
   * حساب المجموع الفرعي للخدمات
   * @param services قائمة الخدمات
   * @returns المجموع الفرعي
   */
  private calculateSubtotal(services: ServiceDto[]): number {
    return services.reduce(
      (total, service) => total + (service.servicePrice || 0),
      0,
    );
  }

  /**
   * البحث عن عميل موجود أو إنشاء عميل جديد
   * @param createClientDto بيانات إنشاء العميل
   * @returns وثيقة العميل
   */
  private async findOrCreateClient(
    createClientDto: createClientAndOrderDto,
  ): Promise<ClientDocument> {
    const existingClient = await this.clientModel.findOne({
      phone: createClientDto.phone,
    });

    if (existingClient) {
      return existingClient;
    }

    return await this.clientModel.create({
      firstName: createClientDto.firstName,
      middleName: createClientDto.middleName,
      lastName: createClientDto.lastName,
      email: createClientDto.email,
      phone: createClientDto.phone,
      clientType: createClientDto.clientType,
      branch: createClientDto.branch,
    });
  }

  /**
   * إنشاء طلب جديد إذا كانت البيانات كافية
   * @param client بيانات العميل
   * @param createClientDto بيانات إنشاء العميل
   * @returns وثيقة الطلب أو null إذا لم يتم إنشاء طلب
   */
  private async maybeCreateOrder(
    client: ClientDocument,
    createClientDto: createClientAndOrderDto,
  ): Promise<OrdersDocument | null> {
    if (!this.shouldCreateOrder(createClientDto)) {
      return null;
    }

    const preparedServices = this.prepareServices(createClientDto.services);
    const orderData = this.buildOrderData(
      client,
      createClientDto,
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

  /**
   * تحديد ما إذا كان يجب إنشاء طلب
   * @param createClientDto بيانات إنشاء العميل
   * @returns true إذا كان يجب إنشاء طلب، false إذا لا
   */
  private shouldCreateOrder(createClientDto: createClientAndOrderDto): boolean {
    const requiredCarFields = [
      createClientDto.carType,
      createClientDto.carModel,
      createClientDto.carColor,
      createClientDto.carPlateNumber,
      createClientDto.carManufacturer,
      createClientDto.carSize,
    ];

    return (
      requiredCarFields.every((field) => !!field) &&
      createClientDto.services?.length > 0
    );
  }

  /**
   * تحضير بيانات الخدمات للطلب
   * @param services قائمة الخدمات
   * @returns قائمة الخدمات المحضرة
   */
  private prepareServices(services?: ServiceDto[]): any[] {
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

  /**
   * إضافة حقول خاصة بالخدمة
   * @param preparedService كائن الخدمة المحضر
   * @param service بيانات الخدمة الأصلية
   */
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

  /**
   * بناء بيانات الطلب
   * @param client بيانات العميل
   * @param createClientDto بيانات إنشاء العميل
   * @param services قائمة الخدمات المحضرة
   * @returns كائن يحتوي على بيانات الطلب
   */
  private buildOrderData(
    client: ClientDocument,
    createClientDto: createClientAndOrderDto,
    services: any[],
  ): any {
    return {
      clientId: client._id,
      carType: createClientDto.carType,
      carModel: createClientDto.carModel,
      carColor: createClientDto.carColor,
      carPlateNumber: createClientDto.carPlateNumber,
      carManufacturer: createClientDto.carManufacturer,
      carSize: createClientDto.carSize,
      services,
    };
  }

  /**
   * معالجة أخطاء إنشاء العميل
   * @param error الخطأ الذي حدث
   * @throws استثناء مناسب حسب نوع الخطأ
   */
  private handleCreateClientError(error: any): never {
    console.error('Error in createClient:', error);

    if (error.code === 11000) {
      throw new ConflictException(
        'Client with this phone number already exists',
      );
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

    if (error instanceof Error && error.message.includes('required')) {
      throw new BadRequestException(error.message);
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
      error.message ||
        'An unexpected error occurred while creating client and order',
    );
  }

  // باقي الدوال الموجودة في الخدمة (addServicesToOrder, getClientWithOrders, getClients, updateClient, deleteClient, findOne)
  // ... [يتم الحفاظ على الدوال الأخرى كما هي بدون تغيير]

  async addServicesToOrder(addServicesDto: AddServicesToOrderDto) {
    // Validate input
    if (!addServicesDto || typeof addServicesDto !== 'object') {
      throw new BadRequestException('Invalid input data');
    }

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

      // Validate services array
      if (
        !Array.isArray(addServicesDto.services) ||
        addServicesDto.services.length === 0
      ) {
        throw new BadRequestException('At least one service is required');
      }

      // Prepare new services
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

        // Add service-specific fields
        switch (serviceDto.serviceType) {
          case 'protection':
            if (serviceDto.protectionFinish)
              service.protectionFinish = serviceDto.protectionFinish;
            if (serviceDto.protectionSize)
              service.protectionSize = serviceDto.protectionSize;
            if (serviceDto.protectionCoverage)
              service.protectionCoverage = serviceDto.protectionCoverage;
            if (serviceDto.originalCarColor)
              service.originalCarColor = serviceDto.originalCarColor;
            if (serviceDto.protectionColor)
              service.protectionColor = serviceDto.protectionColor;
            break;

          case 'insulator':
            if (serviceDto.insulatorType)
              service.insulatorType = serviceDto.insulatorType;
            if (serviceDto.insulatorCoverage)
              service.insulatorCoverage = serviceDto.insulatorCoverage;
            break;

          case 'polish':
            if (serviceDto.polishType)
              service.polishType = serviceDto.polishType;
            if (serviceDto.polishSubType)
              service.polishSubType = serviceDto.polishSubType;
            break;

          case 'additions':
            if (serviceDto.additionType)
              service.additionType = serviceDto.additionType;
            if (serviceDto.washScope) service.washScope = serviceDto.washScope;
            break;
        }

        return service;
      });

      // Add services to order
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

      // Handle date parsing errors
      if (
        error instanceof RangeError &&
        error.message.includes('Invalid time value')
      ) {
        throw new BadRequestException(
          'Invalid date format. Please use YYYY-MM-DD format',
        );
      }

      // Handle null/undefined errors
      if (
        error.message.includes('Cannot convert undefined or null to object')
      ) {
        throw new BadRequestException('Missing required fields in the request');
      }

      throw new BadRequestException(
        error.message || 'Failed to add services to order',
      );
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

  async updateClient(
    clientId: string,
    updateClientDto: UpdateClientDto,
  ): Promise<Client> {
    // 1. Validate ObjectId format
    if (!Types.ObjectId.isValid(clientId)) {
      throw new BadRequestException('Invalid client ID format');
    }

    // 2. Check if phone/email already exists (in parallel for better performance)
    const [existingPhone, existingEmail] = await Promise.all([
      updateClientDto.phone
        ? this.clientModel.findOne({
            phone: updateClientDto.phone,
            _id: { $ne: clientId },
          })
        : null,
      updateClientDto.email
        ? this.clientModel.findOne({
            email: updateClientDto.email,
            _id: { $ne: clientId },
          })
        : null,
    ]);

    if (existingPhone) {
      throw new ConflictException('Phone number already in use');
    }
    if (existingEmail) {
      throw new ConflictException('Email already in use');
    }

    // 3. Update client with atomic operation
    const updatedClient = await this.clientModel
      .findByIdAndUpdate(
        clientId,
        updateClientDto,
        { new: true, runValidators: true }, // Ensures updated doc is returned & schema validations run
      )
      .lean<Client>()
      .exec();

    if (!updatedClient) {
      throw new NotFoundException('Client not found');
    }

    return updatedClient;
  }

  async deleteClient(clientId: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(clientId)) {
      throw new BadRequestException('Invalid client ID format');
    }
    const deleteClient = await this.clientModel
      .findByIdAndUpdate(
        clientId,
        {
          isDeleted: true,
        },
        { new: true, runValidators: true }, // Ensures updated doc is returned & schema validations run
      )
      .lean<Client>()
      .exec();

    if (!deleteClient) {
      throw new NotFoundException('Client not found succefully');
    }

    return { message: 'Client is deleted' };
  }

  async findOne(id: string) {
    const client = await this.clientModel
      .findOne({
        _id: id,
        isDeleted: false,
      })
      .exec();

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }
}
