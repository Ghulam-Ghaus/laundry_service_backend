import { Injectable, BadRequestException } from '@nestjs/common';
import { AdminQueries } from './queries/admin.queries';
import { LookupsQueries } from '../lookups/queries/lookups.queries';
import { OrdersQueries } from '../orders/queries/orders.queries';

@Injectable()
export class AdminService {
  constructor(
    private readonly adminQueries: AdminQueries,
    private readonly lookupsQueries: LookupsQueries,
    private readonly ordersQueries: OrdersQueries,
  ) {}

  async getDashboardStats() {
    // 1. Fetch count by status id
    const statusCounts = await this.adminQueries.getOrdersCountByStatus();
    
    // 2. Fetch today's count & revenue estimate
    const todayOrders = await this.adminQueries.getTodayOrdersCount();
    const revenueEstimate = await this.adminQueries.getRevenueSum();

    let pendingPickup = 0;
    let inCleaning = 0;
    let readyForDelivery = 0;
    let completed = 0;
    let failedCancelled = 0;

    for (const item of statusCounts) {
      const lookupVal = await this.lookupsQueries.findValueById(item.status_id);
      if (!lookupVal) continue;

      const code = lookupVal.code;
      if (['pending_confirmation', 'confirmed', 'assigned', 'pickup_in_progress'].includes(code)) {
        pendingPickup += item.count;
      } else if (code === 'cleaning') {
        inCleaning += item.count;
      } else if (code === 'ready_for_delivery') {
        readyForDelivery += item.count;
      } else if (['delivered', 'completed'].includes(code)) {
        completed += item.count;
      } else if (['cancelled', 'failed'].includes(code)) {
        failedCancelled += item.count;
      }
    }

    return {
      todayOrders,
      pendingPickup,
      inCleaning,
      readyForDelivery,
      completed,
      failedCancelled,
      revenueEstimate: parseFloat(revenueEstimate.toFixed(2)),
      currencyCode: 'PKR',
    };
  }

  // --- Settings ---
  async getSettings() {
    return this.adminQueries.findAllSettings();
  }

  async updateSettings(settingsPayload: Record<string, any>, actorUserId: string) {
    for (const [key, value] of Object.entries(settingsPayload)) {
      await this.adminQueries.updateSetting(key, value);
      // Log audit trace
      await this.ordersQueries.createAuditLog({
        actorUserId,
        action: 'SYSTEM_SETTING_UPDATED',
        entityName: 'system_settings',
        entityId: null,
        newValues: { key, value },
      });
    }
    return { message: 'Settings updated successfully' };
  }

  // --- Audit Logs ---
  async getAuditLogs(page: number, limit: number, action?: string) {
    const result = await this.adminQueries.findAuditLogs(page, limit, action);
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

  // --- Trash bin ---
  async getTrashRecords(entityName: string) {
    return this.adminQueries.findSoftDeletedRecords(entityName);
  }

  async restoreRecord(entityName: string, id: string, actorUserId: string) {
    await this.adminQueries.restoreRecord(entityName, id);

    // Audit log
    await this.ordersQueries.createAuditLog({
      actorUserId,
      action: 'RECORD_RESTORED',
      entityName,
      entityId: id,
    });

    return { message: `${entityName} record restored successfully` };
  }
}
