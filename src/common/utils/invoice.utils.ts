import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Invoice } from 'src/schemas/invoice.schema';

@Injectable()
export class InvoiceUtils {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<Invoice>,
  ) {}

  async generateInvoiceNumber(): Promise<string> {
    const lastInvoice = await this.invoiceModel.findOne(
      {},
      {},
      { sort: { createdAt: -1 } },
    );
    
    if (!lastInvoice) {
      return '100001';
    }
    
    const lastNumber = parseInt(lastInvoice.invoiceNumber, 10);
    return (lastNumber + 1).toString();
  }

  calculateInvoiceTotals(items: any[]) {
    const subtotal = items.reduce(
      (sum, item) => sum + item.unitPrice * (item.quantity || 1),
      0,
    );
    
    const taxAmount = items.reduce(
      (sum, item) => sum + (item.unitPrice * (item.quantity || 1) * (item.taxRate || 0)) / 100,
      0,
    );
    
    return {
      subtotal,
      taxAmount,
      totalAmount: subtotal + taxAmount,
    };
  }
}