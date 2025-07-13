import { AuthRequest } from './../../interfaces/AuthRequest';
import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  NotFoundException,
  UseGuards,
  Patch,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwtAuthGuard';
import { OrdersService } from './orders.service';
import { AddGuaranteeDto } from './dto/create-guarantee.dto';
import { Role } from 'src/common/decorators/roles.decorator';
import { userRoles } from 'src/common/enum/userRoles.enum';
import { AddServicesToOrderDto } from './dto/add-service.dto';
import { CreateOrderForExistingClientDto } from './dto/add-order';

@Controller('orders')
//@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('add-order/:clientId')
  async createOrderForExistingClient(
    @Param('clientId') clientId: string,
    @Body() addServiceDto: any,
  ) {
      
    return this.ordersService.createOrderForExistingClient(
      clientId,
      addServiceDto,
    );
  }

  @Get()
  async findAll() {
    return this.ordersService.findAll();
  }

  @Post('add-service')
  async addServiceToOrder(@Body() addServiceDto: AddServicesToOrderDto) {
    return this.ordersService.addServicesToOrder(addServiceDto);
  }

  @Get(':orderId')
  async findOne(@Param('orderId') orderId: string) {
    const order = await this.ordersService.findOne(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateOrderDto: any) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }

  @Get('client/:clientId')
  async findByClient(@Param('clientId') clientId: string) {
    return this.ordersService.findByClient(clientId);
  }

  @Get('active-guarantees')
  async findActiveGuarantees() {
    return this.ordersService.findActiveGuarantees();
  }

  @Patch(':orderId/guarantee/:guaranteeId/status')
  async updateGuaranteeStatus(
    @Param('orderId') orderId: string,
    @Param('guaranteeId') guaranteeId: string,
    @Body('status') newStatus: 'active' | 'inactive',
  ) {
    return this.ordersService.manuallyUpdateGuaranteeStatus(
      orderId,
      guaranteeId,
      newStatus,
    );
  }

  @Post(':orderId/guarantee')
  async addGuarantee(
    @Param('orderId') orderId: string,
    @Body() guaranteeData: AddGuaranteeDto,
  ) {
    return this.ordersService.addGuaranteeToOrder(orderId, guaranteeData);
  }

  @Role(userRoles.ADMIN)
  @Patch(':orderId/guarantee/:guaranteeId/accept')
  async acceptGuarantee(
    @Param('orderId') orderId: string,
    @Param('guaranteeId') guaranteeIndex: string,
    @Body('accepted') accepted: boolean,
  ) {
    return this.ordersService.updateGuaranteeAcceptance(
      orderId,
      guaranteeIndex,
      accepted,
    );
  }
}
