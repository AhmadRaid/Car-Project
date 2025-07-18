// src/invoice/invoice.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
  HttpStatus,
} from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  async create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoiceService.create(createInvoiceDto);
  }

  @Get()
  async findAll() {
    return this.invoiceService.findAll();
  }

  @Get('order/:orderId')
  async findInvoiceByOrderId(@Param('orderId') orderId: string) {
    return this.invoiceService.findInvoiceByOrderId(orderId);
  }

  @Get(':invoiceId')
  async findOne(@Param('invoiceId') invoiceId: string) {
    return this.invoiceService.findOne(invoiceId);
  }

  @Get('by-order/:orderId')
  async findByOrder(@Param('orderId') orderId: string) {
    return this.invoiceService.findByOrder(orderId);
  }

  @Get('by-client/:clientId')
  async findByClient(@Param('clientId') clientId: string) {
    return this.invoiceService.findByClient(clientId);
  }

  // New endpoint for financial reports
  @Get('financial-reports/:clientId')
  async getFinancialReports(@Param('clientId') clientId: string) {
    return this.invoiceService.getFinancialReports(clientId);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateInvoiceDto: UpdateInvoiceDto) {
    return this.invoiceService.update(id, updateInvoiceDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.invoiceService.softDelete(id);
  }

  @Post(':id/restore')
  async restore(@Param('id') id: string) {
    return this.invoiceService.restore(id);
  }
}