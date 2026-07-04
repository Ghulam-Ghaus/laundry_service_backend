import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CreatePaymentLedgerDto } from './dto/payments.dto';

@ApiTags('Admin Payments')
@ApiBearerAuth()
@Controller('admin/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @RequirePermissions('payments.read')
  @ApiOperation({ summary: 'Get all payments ledger logs (Admin)' })
  async getPayments(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.paymentsService.getAllPayments(parseInt(page, 10), parseInt(limit, 10));
  }

  @Post()
  @RequirePermissions('payments.create')
  @ApiOperation({ summary: 'Record manual cash/card ledger entry (Admin)' })
  async recordPayment(@Req() req: any, @Body() dto: CreatePaymentLedgerDto) {
    const actorUserId = req.user.id;
    return this.paymentsService.recordPayment(dto, actorUserId);
  }

  @Get('order/:orderId')
  @RequirePermissions('payments.read')
  @ApiOperation({ summary: 'Get payment list for specific order (Admin)' })
  async getOrderPayments(@Param('orderId') orderId: string) {
    return this.paymentsService.getPaymentsByOrder(orderId);
  }
}
