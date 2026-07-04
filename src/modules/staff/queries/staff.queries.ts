import { Injectable } from '@nestjs/common';
import { SupabaseClientService } from '../../../database/supabase.client';

export interface DbStaffTask {
  id: string;
  order_id: string;
  assigned_to_user_id: string | null;
  task_type_id: string;
  status_id: string;
  scheduled_date: string | null;
  slot_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
}

@Injectable()
export class StaffQueries {
  constructor(private readonly supabase: SupabaseClientService) {}

  async createStaffTask(payload: Omit<DbStaffTask, 'id'>): Promise<DbStaffTask> {
    const { data, error } = await this.supabase.client
      .from('staff_tasks')
      .insert([payload])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create staff task: ${error.message}`);
    }
    return data;
  }

  async findTaskById(id: string): Promise<any | null> {
    const { data, error } = await this.supabase.client
      .from('staff_tasks')
      .select(`
        *,
        task_type:lookup_values!task_type_id(code, label),
        status:lookup_values!status_id(code, label),
        slot:time_slots(label, start_time, end_time),
        order:orders(
          id,
          order_number,
          special_instructions,
          address:customer_addresses(*),
          customer:app_users!customer_id(first_name, last_name, email, phone)
        )
      `)
      .eq('id', id)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch staff task details: ${error.message}`);
    }
    return data;
  }

  async findTasksByStaff(staffUserId: string): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from('staff_tasks')
      .select(`
        id, scheduled_date, notes,
        task_type:lookup_values!task_type_id(code, label),
        status:lookup_values!status_id(code, label),
        order:orders(order_number)
      `)
      .eq('assigned_to_user_id', staffUserId)
      .eq('is_deleted', false)
      .order('scheduled_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch staff tasks: ${error.message}`);
    }
    return data || [];
  }

  async updateTaskStatus(taskId: string, statusId: string, transitionTimes: { startedAt?: Date; completedAt?: Date }): Promise<void> {
    const updates: any = {
      status_id: statusId,
      updated_at: new Date().toISOString(),
    };

    if (transitionTimes.startedAt) {
      updates.started_at = transitionTimes.startedAt.toISOString();
    }
    if (transitionTimes.completedAt) {
      updates.completed_at = transitionTimes.completedAt.toISOString();
    }

    const { error } = await this.supabase.client
      .from('staff_tasks')
      .update(updates)
      .eq('id', taskId);

    if (error) {
      throw new Error(`Failed to update task status: ${error.message}`);
    }
  }

  async updateTaskNotes(taskId: string, notes: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('staff_tasks')
      .update({ notes, updated_at: new Date().toISOString() })
      .eq('id', taskId);

    if (error) {
      throw new Error(`Failed to update task notes: ${error.message}`);
    }
  }
}
