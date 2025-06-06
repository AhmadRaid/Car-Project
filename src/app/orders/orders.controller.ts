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
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwtAuthGuard';
import { OrdersService } from './orders.service';
import { AddGuaranteeDto } from './dto/create-guarantee.dto';

@Controller('orders')
//@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(@Body() createOrderDto: any) {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  async findAll(
    @Query('clientId') clientId?: string,
    @Query('guaranteeType') guaranteeType?: any,
  ) {
    return this.ordersService.findAll({ clientId, guaranteeType });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const order = await this.ordersService.findOne(id);
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
  @Patch(':orderId/guarantees/:guaranteeIndex/status')
  async updateGuaranteeStatus(
    @Param('orderId') orderId: string,
    @Param('guaranteeIndex') guaranteeIndex: number,
    @Body('status') newStatus: 'active' | 'inactive',
  ) {
    return this.ordersService.manuallyUpdateGuaranteeStatus(
      orderId,
      guaranteeIndex,
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
}
