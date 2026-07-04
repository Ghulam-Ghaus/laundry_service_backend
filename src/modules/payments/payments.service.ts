import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentsQueries, DbPayment } from './queries/payments.queries';
import { OrdersQueries } from '../orders/queries/orders.queries';
import { LookupsQueries } from '../lookups/queries/lookups.queries';
import { CreatePaymentLedgerDto } from './dto/payments.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentsQueries: PaymentsQueries,
    private readonly ordersQueries: OrdersQueries,
    private readonly lookupsQueries: LookupsQueries,
  ) {}

  async recordPayment(dto: CreatePaymentLedgerDto, actorUserId: string): Promise<DbPayment> {
    // 1. Verify order exists
    const order = await this.ordersQueries.findOrderById(dto.orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (dto.amount <= 0) {
      throw new BadRequestException('Payment amount must be a positive decimal');
    }

    // 2. Resolve lookup values
    const methodVal = await this.lookupsQueries.findValueByCode('payment_method', dto.paymentMethodCode);
    if (!methodVal) {
      throw new BadRequestException(`Payment method ${dto.paymentMethodCode} is invalid`);
    }

    const statusVal = await this.lookupsQueries.findValueByCode('payment_status', dto.paymentStatusCode);
    if (!statusVal) {
      throw new BadRequestException(`Payment status ${dto.paymentStatusCode} is invalid`);
    }

    // 3. Save ledger row
    const payment = await this.paymentsQueries.createPayment({
      orderId: dto.orderId,
      paymentMethodId: methodVal.id,
      paymentStatusId: statusVal.id,
      amount: dto.amount,
      currencyCode: order.currency_code,
      provider: dto.provider,
      providerReference: dto.providerReference,
      paidAt: dto.paymentStatusCode === 'paid' ? new Date().toISOString() : undefined,
    });

    // 4. Audit Log
    await this.ordersQueries.createAuditLog({
      actorUserId,
      action: 'PAYMENT_RECORDED',
      entityName: 'payments',
      entityId: payment.id,
      newValues: payment,
    });

    return payment;
  }

  async getPaymentsByOrder(orderId: string): Promise<any[]> {
    const order = await this.ordersQueries.findOrderById(orderId);
    if (!order) throw new NotFoundException('Order not found');
    return this.paymentsQueries.findPaymentsByOrder(orderId);
  }

  async getAllPayments(page: number, limit: number) {
    const result = await this.paymentsQueries.findAllPayments(page, limit);
    return {
      items: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }
}
