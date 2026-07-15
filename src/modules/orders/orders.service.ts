import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdersQueries, DbOrder, DbOrderItem } from './queries/orders.queries';
import { CatalogQueries } from '../catalog/queries/catalog.queries';
import { LookupsQueries } from '../lookups/queries/lookups.queries';
import { UsersQueries } from '../users/queries/users.queries';
import { CreateOrderDto, CreateDraftOrderDto, OrderQuoteDto, UpdateOrderStatusDto, AssignStaffDto } from './dto/orders.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersQueries: OrdersQueries,
    private readonly catalogQueries: CatalogQueries,
    private readonly lookupsQueries: LookupsQueries,
    private readonly usersQueries: UsersQueries,
  ) {}

  // --- Quote Calculations ---
  async calculateQuote(dto: OrderQuoteDto) {
    let subtotal = 0;
    const currencyCode = 'PKR';
    const itemsSnapshot: any[] = [];

    // 1. Fetch system settings for fee thresholds
    const settings = await this.getSystemSettings();
    const minOrderVal = parseFloat(settings.minimum_order_value || '3000.00');
    const baseServiceFee = parseFloat(settings.service_fee || '100.00');

    if (!dto.isItemSelectionSkipped && dto.items && dto.items.length > 0) {
      for (const itemInput of dto.items) {
        const item = await this.catalogQueries.findItemById(itemInput.itemId);
        const option = await this.catalogQueries.findServiceOptionById(itemInput.serviceOptionId);
        
        if (!item || !option) {
          throw new BadRequestException(`Invalid item or service option ID in selection`);
        }

        const priceRecord = await this.catalogQueries.findCurrentPrice(itemInput.itemId, itemInput.serviceOptionId);
        if (!priceRecord) {
          throw new BadRequestException(`No active price set for item ${item.name} with option ${option.name}`);
        }

        const lineTotal = priceRecord.price * itemInput.quantity;
        subtotal += lineTotal;

        itemsSnapshot.push({
          itemId: item.id,
          serviceOptionId: option.id,
          itemNameSnapshot: item.name,
          serviceNameSnapshot: option.name,
          quantity: itemInput.quantity,
          unitPrice: priceRecord.price,
          lineTotal,
        });
      }
    }

    // 2. Service fee thresholds
    const serviceFee = subtotal > 0 && subtotal < minOrderVal ? baseServiceFee : 0;

    // 3. Discount codes (MVP codes check: e.g. WELCOME25 gives fixed 250 PKR discount)
    let discountTotal = 0;
    if (dto.couponCode && dto.couponCode.toUpperCase() === 'WELCOME25') {
      discountTotal = 250.00;
    }

    const grandTotal = Math.max(0, subtotal + serviceFee - discountTotal);

    return {
      subtotal,
      serviceFee,
      discountTotal,
      grandTotal,
      currencyCode,
      items: itemsSnapshot,
    };
  }

  // --- Create Order ---
  async createOrder(dto: CreateOrderDto, loggedInUserId?: string) {
    // 1. Calculate totals
    const quote = await this.calculateQuote({
      items: dto.items,
      couponCode: dto.couponCode,
      isItemSelectionSkipped: dto.isItemSelectionSkipped,
    });

    // 2. Resolve customer ID (mirror guest if not logged in)
    let customerId = loggedInUserId || null;
    if (!customerId) {
      if (!dto.contact) {
        throw new BadRequestException('Contact details are required for guest checkout');
      }
      // Look up or mirror guest user
      const existingUser = await this.usersQueries.findByEmail(dto.contact.email);
      if (existingUser) {
        customerId = existingUser.id;
      } else {
        // Create mirror guest user (auth_user_id = null for guests)
        const guestUser = await this.usersQueries.createUser({
          auth_user_id: null,
          email: dto.contact.email,
          phone: dto.contact.phone,
          first_name: dto.contact.firstName,
          last_name: dto.contact.lastName || null,
          avatar_url: null,
          preferred_language_id: null,
          default_role_id: null,
        });
        customerId = guestUser.id;
      }
    }

    // 3. Save or fetch address
    let addressId = '';
    const addressDetails = dto.address;
    if (loggedInUserId) {
      // Create user address
      const createdAddress = await this.ordersQueries.createAddress({
        user_id: customerId!,
        area_id: addressDetails.areaId,
        address_type_id: addressDetails.addressTypeId || null,
        address_line_1: addressDetails.addressLine1,
        address_line_2: addressDetails.addressLine2 || null,
        city: addressDetails.city,
        instructions: addressDetails.instructions || null,
        is_default: false,
      });
      addressId = createdAddress.id;
    } else {
      // Save address with customerId
      const createdAddress = await this.ordersQueries.createAddress({
        user_id: customerId!,
        area_id: addressDetails.areaId,
        address_type_id: addressDetails.addressTypeId || null,
        address_line_1: addressDetails.addressLine1,
        address_line_2: addressDetails.addressLine2 || null,
        city: addressDetails.city,
        instructions: addressDetails.instructions || null,
        is_default: false,
      });
      addressId = createdAddress.id;
    }

    // 4. Generate order numberADC-YYYY-XXXXXX
    const currentYear = new Date().getFullYear();
    const sequenceCount = await this.ordersQueries.getOrdersCountForYear(currentYear);
    const orderNumber = `ADC-${currentYear}-${(sequenceCount + 1).toString().padStart(6, '0')}`;

    // 5. Fetch initial order status (e.g. pending_confirmation)
    const initialStatus = await this.lookupsQueries.findValueByCode('order_status', 'pending_confirmation');
    if (!initialStatus) {
      throw new BadRequestException('Initial order status not configured in lookup tables');
    }

    // 6. Create order in table
    const order = await this.ordersQueries.createOrder({
      order_number: orderNumber,
      customer_id: customerId,
      customer_address_id: addressId,
      status_id: initialStatus.id,
      frequency_id: dto.schedule.frequencyId || null,
      pickup_date: dto.schedule.pickupDate,
      pickup_slot_id: dto.schedule.pickupSlotId,
      delivery_date: dto.schedule.deliveryDate,
      delivery_slot_id: dto.schedule.deliverySlotId,
      subtotal: quote.subtotal,
      service_fee: quote.serviceFee,
      discount_total: quote.discountTotal,
      grand_total: quote.grandTotal,
      currency_code: quote.currencyCode,
      special_instructions: dto.specialInstructions || null,
      is_item_selection_skipped: dto.isItemSelectionSkipped,
      metadata: {},
    });

    // 7. Save order items
    if (quote.items && quote.items.length > 0) {
      const itemsToInsert = quote.items.map((i: any) => ({
        order_id: order.id,
        item_id: i.itemId,
        service_option_id: i.serviceOptionId,
        status_id: null,
        item_name_snapshot: i.itemNameSnapshot,
        service_name_snapshot: i.serviceNameSnapshot,
        quantity: i.quantity,
        unit_price: i.unitPrice,
        line_total: i.lineTotal,
      }));
      await this.ordersQueries.createOrderItems(itemsToInsert);
    }

    // 8. Log initial status history
    await this.ordersQueries.createStatusHistory({
      order_id: order.id,
      from_status_id: null,
      to_status_id: initialStatus.id,
      changed_by: customerId,
      note: 'Order submitted by customer',
    });

    // 9. Audit log
    await this.ordersQueries.createAuditLog({
      actorUserId: customerId,
      action: 'ORDER_CREATED',
      entityName: 'orders',
      entityId: order.id,
      newValues: order,
    });

    return {
      orderId: order.id,
      orderNumber: order.order_number,
      status: {
        code: initialStatus.code,
        label: initialStatus.label,
      },
      totals: {
        subtotal: order.subtotal.toFixed(2),
        serviceFee: order.service_fee.toFixed(2),
        discountTotal: order.discount_total.toFixed(2),
        grandTotal: order.grand_total.toFixed(2),
        currencyCode: order.currency_code,
      },
    };
  }

  async createDraftOrder(dto: CreateDraftOrderDto) {
    const orderDate = new Date(dto.orderDate);
    const deliveryDate = new Date(dto.deliveryDate);

    if (Number.isNaN(orderDate.getTime()) || Number.isNaN(deliveryDate.getTime())) {
      throw new BadRequestException('Invalid order_date or delivery_date format');
    }
    if (deliveryDate < orderDate) {
      throw new BadRequestException('delivery_date must be the same day or after order_date');
    }

    const draftStatus = await this.lookupsQueries.findValueByCode('order_status', 'draft');
    if (!draftStatus) {
      throw new BadRequestException('Draft order status is not configured');
    }

    // 1. Calculate totals
    const quote = await this.calculateQuote({
      items: dto.items,
      couponCode: dto.couponCode,
      isItemSelectionSkipped: !dto.items || dto.items.length === 0,
    });

    const subtotal = quote.subtotal;
    const serviceFee = quote.serviceFee;
    
    // Parse custom overrides if provided, fallback to calculated totals
    const discountTotal = (dto.discountAmount !== undefined && dto.discountAmount !== null && !Number.isNaN(Number(dto.discountAmount)))
      ? Number(dto.discountAmount)
      : quote.discountTotal;

    const grandTotal = (dto.grandTotal !== undefined && dto.grandTotal !== null && !Number.isNaN(Number(dto.grandTotal)))
      ? Number(dto.grandTotal)
      : Math.max(0, subtotal - discountTotal) + serviceFee;

    const currentYear = new Date().getFullYear();
    const sequenceCount = await this.ordersQueries.getOrdersCountForYear(currentYear);
    const orderNumber = `ADC-${currentYear}-${(sequenceCount + 1).toString().padStart(6, '0')}`;

    const order = await this.ordersQueries.createOrder({
      order_number: orderNumber,
      customer_id: null,
      customer_address_id: null,
      status_id: draftStatus.id,
      frequency_id: null,
      pickup_date: dto.orderDate,
      pickup_slot_id: null,
      delivery_date: dto.deliveryDate,
      delivery_slot_id: null,
      subtotal: subtotal,
      service_fee: serviceFee,
      discount_total: discountTotal,
      grand_total: grandTotal,
      currency_code: 'PKR',
      special_instructions: dto.notes || dto.specialInstructions || null,
      is_item_selection_skipped: !dto.items || dto.items.length === 0,
      metadata: {
        customer_name: dto.customerName,
        phone: dto.phone,
        category_id: dto.categoryId,
        discount_amount: discountTotal,
        notes: dto.notes || dto.specialInstructions || null,
      },
    });

    // 2. Save order items
    if (quote.items && quote.items.length > 0) {
      const itemsToInsert = quote.items.map((i: any) => ({
        order_id: order.id,
        item_id: i.itemId,
        service_option_id: i.serviceOptionId,
        status_id: null,
        item_name_snapshot: i.itemNameSnapshot,
        service_name_snapshot: i.serviceNameSnapshot,
        quantity: i.quantity,
        unit_price: i.unitPrice,
        line_total: i.lineTotal,
      }));
      await this.ordersQueries.createOrderItems(itemsToInsert);
    }

    await this.ordersQueries.createStatusHistory({
      order_id: order.id,
      from_status_id: null,
      to_status_id: draftStatus.id,
      changed_by: null,
      note: 'Draft order created',
    });

    await this.ordersQueries.createAuditLog({
      actorUserId: null,
      action: 'ORDER_DRAFT_CREATED',
      entityName: 'orders',
      entityId: order.id,
      newValues: {
        order_number: order.order_number,
        metadata: order.metadata,
        status: draftStatus.code,
      },
    });

    return {
      orderId: order.id,
      orderNumber: order.order_number,
      status: {
        code: draftStatus.code,
        label: draftStatus.label,
      },
      totals: {
        subtotal: order.subtotal.toFixed(2),
        serviceFee: order.service_fee.toFixed(2),
        discountTotal: order.discount_total.toFixed(2),
        grandTotal: order.grand_total.toFixed(2),
        currencyCode: order.currency_code,
      },
    };
  }

  // --- Read Orders ---
  async getOrderById(id: string) {
    const order = await this.ordersQueries.findOrderById(id);
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async getCustomerOrders(customerId: string) {
    return this.ordersQueries.findOrdersByCustomer(customerId);
  }

  async getAllOrders(page: number, limit: number, status?: string) {
    const result = await this.ordersQueries.findAllOrders(page, limit, status);
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

  // --- Update Order Status ---
  async updateStatus(orderId: string, dto: UpdateOrderStatusDto, actorUserId: string) {
    const order = await this.getOrderById(orderId);
    
    // Resolve status code to lookup ID
    const newStatus = await this.lookupsQueries.findValueByCode('order_status', dto.statusCode);
    if (!newStatus) {
      throw new BadRequestException(`Status code ${dto.statusCode} does not exist`);
    }

    if (order.status_id === newStatus.id) {
      return { message: 'Order is already in this status' };
    }

    // Update status
    await this.ordersQueries.updateOrderStatus(orderId, newStatus.id);

    // Save history
    await this.ordersQueries.createStatusHistory({
      order_id: orderId,
      from_status_id: order.status_id,
      to_status_id: newStatus.id,
      changed_by: actorUserId,
      note: dto.note || 'Status updated by administrator',
    });

    // Audit log
    await this.ordersQueries.createAuditLog({
      actorUserId,
      action: 'ORDER_STATUS_CHANGED',
      entityName: 'orders',
      entityId: orderId,
      oldValues: { statusId: order.status_id },
      newValues: { statusId: newStatus.id, note: dto.note },
    });

    return { message: 'Status updated successfully', statusCode: dto.statusCode };
  }

  async cancelOrder(orderId: string, actorUserId: string) {
    return this.updateStatus(orderId, { statusCode: 'cancelled', note: 'Cancelled by user/admin' }, actorUserId);
  }

  async deleteOrder(id: string, actorUserId: string): Promise<void> {
    await this.getOrderById(id);
    await this.ordersQueries.softDeleteOrder(id);
    await this.ordersQueries.createAuditLog({
      actorUserId,
      action: 'ORDER_DELETED',
      entityName: 'orders',
      entityId: id,
    });
  }

  async restoreOrder(id: string, actorUserId: string): Promise<void> {
    await this.ordersQueries.restoreOrder(id);
    await this.ordersQueries.createAuditLog({
      actorUserId,
      action: 'ORDER_RESTORED',
      entityName: 'orders',
      entityId: id,
    });
  }

  // Helper settings resolver
  private async getSystemSettings(): Promise<Record<string, string>> {
    const defaultSettings = {
      brand_name: 'Awais Dry Cleaner',
      default_currency: 'PKR',
      minimum_order_value: '3000.00',
      service_fee: '100.00',
    };

    try {
      const data = await this.ordersQueries.findSystemSettings();
      if (!data) return defaultSettings;

      const settingsMap: Record<string, string> = {};
      for (const row of data) {
        settingsMap[row.setting_key] = typeof row.setting_value === 'string'
          ? row.setting_value
          : JSON.stringify(row.setting_value);
      }
      return { ...defaultSettings, ...settingsMap };
    } catch {
      return defaultSettings;
    }
  }
}
