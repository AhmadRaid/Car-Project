import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoiceService.createInvoice(createInvoiceDto);
  }

  @Get()
  findAll() {
    return this.invoiceService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoiceService.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateInvoiceDto: UpdateInvoiceDto) {
    return this.invoiceService.updateInvoice(id, updateInvoiceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.invoiceService.deleteInvoice(id);
  }

  @Get('client/:clientId')
  getClientInvoices(@Param('clientId') clientId: string) {
    return this.invoiceService.getClientInvoices(clientId);
  }

  @Post('generate-from-order/:orderId')
  generateFromOrder(@Param('orderId') orderId: string) {
    return this.invoiceService.generateInvoiceFromOrder(orderId);
  }
}