import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { uploadStorageFile } from 'src/config/firebase.config';
import { Client, ClientDocument } from 'src/schemas/client.schema';
import { Orders, OrdersDocument } from 'src/schemas/orders.schema';

@Injectable()
export class ClientService {
  constructor(
    @InjectModel(Client.name) private clientModel: Model<ClientDocument>,
    @InjectModel(Orders.name) private ordersModel: Model<OrdersDocument>,
  ) {}

  async createClient(createClientDto: any): Promise<Client> {
    try {
      // Check if email already exists
      const existingClient = await this.clientModel.findOne({
        phone: createClientDto.phone,
      });
  
      let clientId;
      if (!existingClient) {
        const createdClient = await this.clientModel.create(createClientDto);
        clientId = createdClient._id;
      } else {
        clientId = existingClient._id;
      }
  
      // Create the order
      await this.ordersModel.create({
        clientId: clientId,
        carModel: createClientDto.carModel,
        carColor: createClientDto.carColor,
        service: createClientDto.service,
        guarantee: {
          products: createClientDto.products,
          type: createClientDto.type,
          startDate: createClientDto.startDate,
          endDate: createClientDto.endDate,
          terms: createClientDto.terms,
          coveredComponents: createClientDto.coveredComponents,
        }
      });
  
      return existingClient || await this.clientModel.findById(clientId);
  
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to create client');
    }
  }

  async getAllClients(status?: any): Promise<Client[]> {
    const query: any = { isDeleted: false };
    if (status) {
      query.status = status;
    }
    return this.clientModel.find(query).exec();
  }

  async getClientById(id: string): Promise<Client> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid client ID');
    }

    const client = await this.clientModel.findOne({
      _id: new Types.ObjectId(id),
      isDeleted: false,
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  async updateClient(
    id: string,
    updateClientDto: any,
    image?: Express.Multer.File,
  ): Promise<Client> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid client ID');
      }

      // Handle image upload if image is provided
      if (image) {
        const fileName = `${image.originalname}-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const firebaseImageUrl = await uploadStorageFile(
          fileName,
          'clients',
          image.mimetype,
          image.path,
        );
        updateClientDto.image = firebaseImageUrl;
      }

      // Check if email is being updated and if it already exists
      if (updateClientDto.email) {
        const existingClient = await this.clientModel.findOne({
          email: updateClientDto.email,
          _id: { $ne: new Types.ObjectId(id) },
        });

        if (existingClient) {
          throw new ConflictException('Email already exists');
        }
      }

      const updatedClient = await this.clientModel.findByIdAndUpdate(
        new Types.ObjectId(id),
        { $set: updateClientDto },
        { new: true },
      );

      if (!updatedClient) {
        throw new NotFoundException('Client not found');
      }

      return updatedClient;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to update client');
    }
  }

  async updateClientStatus(id: string, status: any): Promise<Client> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid client ID');
    }

    const updatedClient = await this.clientModel.findByIdAndUpdate(
      new Types.ObjectId(id),
      { status },
      { new: true },
    );

    if (!updatedClient) {
      throw new NotFoundException('Client not found');
    }

    return updatedClient;
  }

  async deleteClient(id: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid client ID');
    }

    const result = await this.clientModel.findByIdAndUpdate(
      new Types.ObjectId(id),
      { isDeleted: true },
      { new: true },
    );

    if (!result) {
      throw new NotFoundException('Client not found');
    }

    return { message: 'Client deleted successfully' };
  }

  async findClientByEmail(email: string): Promise<Client | null> {
    return this.clientModel.findOne({ email, isDeleted: false }).exec();
  }
}
