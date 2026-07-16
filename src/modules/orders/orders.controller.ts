import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from './orders.service';
import { Public } from '../../common/decorators/public.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CreateOrderDto, CreateDraftOrderDto, OrderQuoteDto, UpdateOrderStatusDto, AssignStaffDto, ReleaseOrderDto } from './dto/orders.dto';

@ApiTags('Public Orders')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('quote')
  @ApiOperation({ summary: 'Get a pricing estimate / quote' })
  async getQuote(@Body() dto: OrderQuoteDto) {
    return this.ordersService.calculateQuote(dto);
  }

  @Public()
  @Post('draft')
  @ApiOperation({ summary: 'Create a draft order / receipt' })
  async createDraftOrder(@Body() dto: CreateDraftOrderDto) {
    return this.ordersService.createDraftOrder(dto);
  }

  @Public()
  @Post()
  @ApiOperation({ summary: 'Book a new laundry order (Customer or Guest)' })
  async createOrder(@Req() req: any, @Body() dto: CreateOrderDto) {
    let userId: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const secret = this.configService.get<string>('app.jwt.accessSecret');
        const payload = await this.jwtService.verifyAsync(token, { secret });
        userId = payload.sub;
      } catch {
        throw new UnauthorizedException('Session expired. Please log in again.');
      }
    }

    if (!userId && !dto.contact) {
      throw new BadRequestException('Contact details are required for guest checkout');
    }

    return this.ordersService.createOrder(dto, userId);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get current customer orders list' })
  async getMyOrders(@Req() req: any) {
    const userId = req.user.id;
    return this.ordersService.getCustomerOrders(userId);
  }

  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Get order details by ID' })
  async getMyOrder(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.id;
    const order = await this.ordersService.getOrderById(id);
    // Safety check: ensure customers can only read their own orders
    if (order.customer_id !== userId && !req.user.roles?.includes('super_admin') && !req.user.roles?.includes('admin')) {
      throw new UnauthorizedException('You do not have permission to view this order');
    }
    return order;
  }

  @ApiBearerAuth()
  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel order by customer' })
  async cancelMyOrder(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.id;
    const order = await this.ordersService.getOrderById(id);
    if (order.customer_id !== userId) {
      throw new UnauthorizedException('You can only cancel your own orders');
    }
    // Limit cancellation if already confirm/picked up
    if (order.status?.code !== 'pending_confirmation' && order.status?.code !== 'confirmed') {
      throw new BadRequestException('Orders already in progress cannot be cancelled');
    }
    return this.ordersService.cancelOrder(id, userId);
  }
}

@ApiTags('Admin Orders')
@ApiBearerAuth()
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('pos')
  @RequirePermissions('orders.read')
  @ApiOperation({ summary: 'Get POS orders list (Admin)' })
  async getPosOrders(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.ordersService.getOrdersByType('pos', parseInt(page, 10), parseInt(limit, 10), search, status);
  }

  @Get('pickup')
  @RequirePermissions('orders.read')
  @ApiOperation({ summary: 'Get Pickup orders list (Admin)' })
  async getPickupOrders(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.ordersService.getOrdersByType('pickup', parseInt(page, 10), parseInt(limit, 10), search, status);
  }

  @Get()
  @RequirePermissions('orders.read')
  @ApiOperation({ summary: 'Get all orders list (Admin)' })
  async getOrders(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: string,
  ) {
    return this.ordersService.getAllOrders(parseInt(page, 10), parseInt(limit, 10), status);
  }

  @Get(':id')
  @RequirePermissions('orders.read')
  @ApiOperation({ summary: 'Get full order details by ID (Admin)' })
  async getOrder(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

  @Patch(':id/status')
  @RequirePermissions('orders.change_status')
  @ApiOperation({ summary: 'Change order status (Admin)' })
  async updateStatus(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    const actorUserId = req.user.id;
    return this.ordersService.updateStatus(id, dto, actorUserId);
  }

  @Patch(':id/release')
  @RequirePermissions('orders.update')
  @ApiOperation({ summary: 'Release / Deliver items and record payment (POS)' })
  async releaseOrder(@Req() req: any, @Param('id') id: string, @Body() dto: ReleaseOrderDto) {
    const actorUserId = req.user.id;
    return this.ordersService.releaseOrder(id, dto, actorUserId);
  }

  @Delete(':id')
  @RequirePermissions('orders.update')
  @ApiOperation({ summary: 'Soft delete order record (Admin)' })
  async deleteOrder(@Req() req: any, @Param('id') id: string) {
    const actorUserId = req.user.id;
    await this.ordersService.deleteOrder(id, actorUserId);
    return { message: 'Order record deleted' };
  }

  @Patch(':id/restore')
  @RequirePermissions('orders.update')
  @ApiOperation({ summary: 'Restore soft-deleted order (Admin)' })
  async restoreOrder(@Req() req: any, @Param('id') id: string) {
    const actorUserId = req.user.id;
    await this.ordersService.restoreOrder(id, actorUserId);
    return { message: 'Order record restored' };
  }
}
// Helper decorator imports
import { BadRequestException } from '@nestjs/common';
