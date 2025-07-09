import { Client } from '@googlemaps/google-maps-services-js';
import { Document } from 'mongoose';
import { Orders } from 'src/schemas/orders.schema';

export interface Invoice extends Document {
  invoiceNumber: string;
  invoiceDate: Date;
  clientId: Client;
  orderId: Orders;
  clientName: string;
  clientPhone: string;
  carType: string;
  carModel: string;
  carColor: string;
  carPlateNumber: string[];
  services: Array<{
    serviceType: string;
    serviceName: string;
    servicePrice: number;
    quantity?: number;
  }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  notes: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}