import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ClientService } from '../client/client.service';
import { OrdersService } from '../orders/orders.service';
import { Invoice } from 'src/schemas/invoice.schema';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<Invoice>,
    private readonly clientService: ClientService,
    private readonly ordersService: OrdersService,
  ) {}

  async create(createInvoiceDto: CreateInvoiceDto) {
    try {
      // التحقق من وجود العميل والطلب
      await this.validateClientAndOrder(
        createInvoiceDto.clientId,
        createInvoiceDto.orderId,
      );

      const createdInvoice = new this.invoiceModel({
        ...createInvoiceDto,
        taxRate: createInvoiceDto.taxRate || 15, // Default tax rate 15%
      });

      return await createdInvoice.save();
    } catch (error) {
      this.handleInvoiceError(error);
    }
  }

  async findAll() {
    return this.invoiceModel
      .find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findInvoiceByOrderId(orderId: string) {
    const [invoice] = await this.invoiceModel.aggregate([
      {
        $match: {
          orderId: new Types.ObjectId(orderId),
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: 'clients',
          localField: 'clientId',
          foreignField: '_id',
          as: 'client',
          pipeline: [
            {
              $project: {
                firstName: 1,
                middleName: 1,
                lastName: 1,
                clientNumber: 1,
                phone: 1,
                email: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'orders',
          localField: 'orderId',
          foreignField: '_id',
          as: 'order',
          pipeline: [
            {
              $lookup: {
                from: 'invoices',
                localField: 'invoiceId',
                foreignField: '_id',
                as: 'invoice',
              },
            },
            {
              $unwind: {
                path: '$invoice',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                orderNumber: 1,
                carType: 1,
                carModel: 1,
                carColor: 1,
                carPlateNumber: 1,
                carManufacturer: 1,
                carSize: 1,
                services: 1,
                createdAt: 1,
                invoiceId: 1,
                invoiceNumber: '$invoice.invoiceNumber',
              },
            },
          ],
        },
      },
      {
        $unwind: '$client',
      },
      {
        $unwind: '$order',
      },
      {
        $addFields: {
          'order.services': {
            $map: {
              input: '$order.services',
              as: 'service',
              in: {
                $mergeObjects: [
                  '$$service',
                  {
                    serviceTypeArabic: {
                      $switch: {
                        branches: [
                          { case: { $eq: ['$$service.serviceType', 'protection'] }, then: 'حماية' },
                          { case: { $eq: ['$$service.serviceType', 'polish'] }, then: 'تلميع' },
                          { case: { $eq: ['$$service.serviceType', 'insulator'] }, then: 'عازل حراري' },
                          { case: { $eq: ['$$service.serviceType', 'additions'] }, then: 'إضافات' },
                        ],
                        default: '$$service.serviceType'
                      }
                    },
                    guaranteePeriod: {
                      $arrayElemAt: [
                        {
                          $split: ['$$service.guarantee.typeGuarantee', ' ']
                        },
                        0
                      ]
                    }
                  }
                ]
              }
            }
          },
          formattedInvoiceDate: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$invoiceDate',
            },
          },
          formattedOrderDate: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$order.createdAt',
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          invoiceNumber: 1,
          invoiceDate: '$formattedInvoiceDate',
          subtotal: 1,
          taxRate: 1,
          taxAmount: 1,
          totalAmount: 1,
          notes: 1,
          client: 1,
          order: {
            orderNumber: 1,
            carType: 1,
            carModel: 1,
            carColor: 1,
            carPlateNumber: 1,
            carManufacturer: 1,
            carSize: 1,
            services: 1,
            orderDate: '$formattedOrderDate',
            invoiceNumber: '$order.invoiceNumber',
          },
        },
      },
    ]);

    if (!invoice) {
      throw new NotFoundException('Invoice not found for this order');
    }

    // تحويل تاريخ الضمان لكل خدمة
    invoice.order.services = invoice.order.services.map(service => {
      return {
        ...service,
        guarantee: {
          ...service.guarantee,
          startDate: new Date(service.guarantee.startDate).toLocaleDateString('ar-SA'),
          endDate: new Date(service.guarantee.endDate).toLocaleDateString('ar-SA'),
        }
      };
    });

    return invoice;
}

  async findOne(invoiceId: string) {
    const [invoice] = await this.invoiceModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(invoiceId),
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: 'clients', // Make sure this matches your actual collection name
          localField: 'clientId',
          foreignField: '_id',
          as: 'client',
          pipeline: [
            {
              $project: {
                firstName: 1,
                middleName: 1,
                lastName: 1,
                clientNumber: 1,
                phone: 1,
              },
            }, // Only include fields needed for PDF
          ],
        },
      },
      {
        $lookup: {
          from: 'orders', // Make sure this matches your actual collection name
          localField: 'orderId',
          foreignField: '_id',
          as: 'order',
        },
      },
      {
        $unwind: '$client', // Convert client array to object
      },
      {
        $unwind: '$order', // Convert order array to object
      },
      {
        $addFields: {
          formattedDate: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$invoiceDate',
            },
          },
          // Add any other calculated fields needed for PDF
        },
      },
      {
        $project: {
          invoiceNumber: 1,
          invoiceDate: '$formattedDate',
          subtotal: 1,
          taxRate: 1,
          taxAmount: 1,
          totalAmount: 1,
          notes: 1,
          client: 1,
          order: 1,
          // Include any other fields needed for PDF
        },
      },
    ]);

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async findByOrder(orderId: string) {
    return this.invoiceModel
      .find({ orderId, isDeleted: false })
      .sort({ createdAt: -1 });
  }

  async findByClient(clientId: string) {
    return this.invoiceModel
      .find({ clientId, isDeleted: false })
      .sort({ createdAt: -1 });
  }

  async update(id: string, updateInvoiceDto: any) {
    try {
      const invoice = await this.findOne(id);

      // إذا تم تحديث الخدمات، نعيد حساب المبالغ
      if (updateInvoiceDto.services) {
        updateInvoiceDto.subtotal = this.calculateSubtotal(
          updateInvoiceDto.services,
        );
        updateInvoiceDto.taxAmount =
          updateInvoiceDto.subtotal * ((updateInvoiceDto.taxRate || 15) / 100);
        updateInvoiceDto.totalAmount =
          updateInvoiceDto.subtotal + updateInvoiceDto.taxAmount;
      }

      Object.assign(invoice, updateInvoiceDto);

      return await invoice.save();
    } catch (error) {
      this.handleInvoiceError(error);
    }
  }

  async softDelete(id: string) {
    const invoice = await this.findOne(id);
    invoice.isDeleted = true;
    return await invoice.save();
  }

  async restore(id: string) {
    const invoice = await this.invoiceModel.findOne({ _id: id });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    invoice.isDeleted = false;
    return await invoice.save();
  }

  private async validateClientAndOrder(clientId: string, orderId: string) {
    const [client, order] = await Promise.all([
      this.clientService.findOne(clientId),
      this.ordersService.findOne(orderId),
    ]);

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.clientId.toString() !== clientId) {
      throw new BadRequestException('Order does not belong to this client');
    }
  }

  private calculateSubtotal(
    services: Array<{ servicePrice: number; quantity?: number }>,
  ): number {
    return services.reduce(
      (total, service) =>
        total + service.servicePrice * (service.quantity || 1),
      0,
    );
  }

  private handleInvoiceError(error: any) {
    if (error.code === 11000) {
      throw new ConflictException('Invoice with this number already exists');
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
      throw new BadRequestException(`Invalid ID format`);
    }

    if (error instanceof NotFoundException) {
      throw error;
    }

    throw new BadRequestException(error.message || 'An error occurred');
  }
}
