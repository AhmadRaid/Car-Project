import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Invoice } from 'src/schemas/invoice.schema';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<Invoice>,
  ) {}

  async createInvoice(createInvoiceDto: any) {
    const invoiceNumber = await generateInvoiceNumber();
    const invoice = new this.invoiceModel({
      ...createInvoiceDto,
      invoiceNumber,
    });
    return invoice.save();
  }

  async findAll() {
    return this.invoiceModel.find({ isDeleted: false })
      .populate('clientId')
      .populate('orderId');
  }

  async findById(id: string) {
    return this.invoiceModel.findById(id)
      .populate('clientId')
      .populate('orderId');
  }

  async updateInvoice(id: string, updateInvoiceDto: any) {
    return this.invoiceModel.findByIdAndUpdate(id, updateInvoiceDto, { new: true });
  }

  async deleteInvoice(id: string) {
    return this.invoiceModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
  }

  async getClientInvoices(clientId: string) {
    return this.invoiceModel.find({ clientId, isDeleted: false })
      .populate('orderId');
  }

  async generateInvoiceFromOrder(orderId: string) {
    // Logic to generate invoice from order
    // You'll need to fetch the order and its services
    // Then calculate totals and create invoice items
  }
}

function generateInvoiceNumber() {
    throw new Error('Function not implemented.');
}
