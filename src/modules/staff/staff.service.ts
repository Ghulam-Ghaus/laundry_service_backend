import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { StaffQueries, DbStaffTask } from './queries/staff.queries';
import { OrdersQueries } from '../orders/queries/orders.queries';
import { LookupsQueries } from '../lookups/queries/lookups.queries';
import { UsersQueries } from '../users/queries/users.queries';
import { AssignStaffDto } from '../orders/dto/orders.dto';

@Injectable()
export class StaffService {
  constructor(
    private readonly staffQueries: StaffQueries,
    private readonly ordersQueries: OrdersQueries,
    private readonly lookupsQueries: LookupsQueries,
    private readonly usersQueries: UsersQueries,
  ) {}

  // --- Staff Operations ---
  async getStaffTasks(staffUserId: string): Promise<any[]> {
    return this.staffQueries.findTasksByStaff(staffUserId);
  }

  async getTaskById(id: string, staffUserId: string): Promise<any> {
    const task = await this.staffQueries.findTaskById(id);
    if (!task) throw new NotFoundException('Task not found');

    // Safety rule: Staff can only access tasks assigned to them
    if (task.assigned_to_user_id !== staffUserId) {
      throw new UnauthorizedException('You do not have permission to access this task');
    }
    return task;
  }

  async updateTaskStatus(id: string, statusCode: string, staffUserId: string): Promise<any> {
    const task = await this.getTaskById(id, staffUserId);

    // Resolve task status lookup ID
    const taskStatus = await this.lookupsQueries.findValueByCode('task_status', statusCode);
    if (!taskStatus) {
      throw new BadRequestException(`Task status code ${statusCode} does not exist`);
    }

    const times: { startedAt?: Date; completedAt?: Date } = {};
    if (statusCode === 'in_progress') {
      times.startedAt = new Date();
    } else if (statusCode === 'completed') {
      times.completedAt = new Date();
    }

    await this.staffQueries.updateTaskStatus(id, taskStatus.id, times);

    // Trigger Order Status transitions on Task Completions
    if (statusCode === 'completed') {
      const taskTypeCode = task.task_type?.code;
      let orderStatusCode = '';
      let notes = '';

      if (taskTypeCode === 'pickup') {
        orderStatusCode = 'picked_up';
        notes = 'Pickup task completed by rider';
      } else if (taskTypeCode === 'cleaning') {
        orderStatusCode = 'ready_for_delivery';
        notes = 'Cleaning process completed';
      } else if (taskTypeCode === 'delivery') {
        orderStatusCode = 'delivered';
        notes = 'Order delivered to customer';
      }

      if (orderStatusCode) {
        // Fetch lookup status id
        const statusVal = await this.lookupsQueries.findValueByCode('order_status', orderStatusCode);
        if (statusVal) {
          // Update order status
          await this.ordersQueries.updateOrderStatus(task.order_id, statusVal.id);
          // Log history
          await this.ordersQueries.createStatusHistory({
            order_id: task.order_id,
            from_status_id: task.order.status_id,
            to_status_id: statusVal.id,
            changed_by: staffUserId,
            note: notes,
          });
          // Audit Log
          await this.ordersQueries.createAuditLog({
            actorUserId: staffUserId,
            action: 'ORDER_STATUS_CHANGED',
            entityName: 'orders',
            entityId: task.order_id,
            newValues: { statusId: statusVal.id, reason: notes },
          });
        }
      }
    }

    return { message: 'Task status updated successfully', status: statusCode };
  }

  async addTaskNotes(id: string, notes: string, staffUserId: string): Promise<any> {
    await this.getTaskById(id, staffUserId);
    await this.staffQueries.updateTaskNotes(id, notes);
    return { message: 'Task notes updated successfully' };
  }

  // --- Admin Staff Assignment Trigger ---
  async assignStaffToOrder(orderId: string, dto: AssignStaffDto, adminActorUserId: string): Promise<any> {
    const order = await this.ordersQueries.findOrderById(orderId);
    if (!order) throw new NotFoundException('Order not found');

    // 1. Verify staff exists
    const staff = await this.usersQueries.findById(dto.staffUserId);
    if (!staff || !staff.is_active) {
      throw new BadRequestException('Staff user not found or inactive');
    }

    // 2. Resolve task type lookup ID from code
    const taskType = await this.lookupsQueries.findValueByCode('task_type', dto.taskTypeCode);
    if (!taskType) {
      throw new BadRequestException(`Task type ${dto.taskTypeCode} does not exist`);
    }

    // 3. Resolve initial task status (assigned)
    const taskStatus = await this.lookupsQueries.findValueByCode('task_status', 'assigned');
    if (!taskStatus) {
      throw new BadRequestException('Task status "assigned" not found in lookups');
    }

    // 4. Create task
    const task = await this.staffQueries.createStaffTask({
      order_id: orderId,
      assigned_to_user_id: dto.staffUserId,
      task_type_id: taskType.id,
      status_id: taskStatus.id,
      scheduled_date: order.pickup_date,
      slot_id: order.pickup_slot_id,
      notes: null,
      started_at: null,
      completed_at: null,
    });

    // 5. Update order status to assigned
    const assignedStatus = await this.lookupsQueries.findValueByCode('order_status', 'assigned');
    if (assignedStatus && order.status_id !== assignedStatus.id) {
      await this.ordersQueries.updateOrderStatus(orderId, assignedStatus.id);
      await this.ordersQueries.createStatusHistory({
        order_id: orderId,
        from_status_id: order.status_id,
        to_status_id: assignedStatus.id,
        changed_by: adminActorUserId,
        note: `Staff rider ${staff.first_name} assigned for ${dto.taskTypeCode}`,
      });
    }

    // 6. Audit log staff assignment
    await this.ordersQueries.createAuditLog({
      actorUserId: adminActorUserId,
      action: 'ORDER_STAFF_ASSIGNED',
      entityName: 'orders',
      entityId: orderId,
      newValues: { staffUserId: dto.staffUserId, taskTypeCode: dto.taskTypeCode },
    });

    return { message: 'Rider assigned and task created successfully', taskId: task.id };
  }
}
