import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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

  async findOne(id: string) {
    const invoice = await this.invoiceModel.findOne({
      _id: id,
      isDeleted: false,
    });

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
      (total, service) => total + service.servicePrice * (service.quantity || 1),
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