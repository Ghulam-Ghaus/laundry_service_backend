import { Injectable } from '@nestjs/common';
import { SupabaseClientService } from '../../../database/supabase.client';

export interface DbTimeSlot {
  id: string;
  slot_type_id: string;
  label: string;
  start_time: string;
  end_time: string;
  capacity: number | null;
  is_active: boolean;
  sort_order: number;
}

export interface DbAreaSlotAvailability {
  id: string;
  area_id: string;
  slot_id: string;
  day_of_week: number;
  is_available: boolean;
  capacity_override: number | null;
}

@Injectable()
export class SlotsQueries {
  constructor(private readonly supabase: SupabaseClientService) {}

  // --- Slots ---
  async findAllSlots(): Promise<DbTimeSlot[]> {
    const { data, error } = await this.supabase.client
      .from('time_slots')
      .select('id, slot_type_id, label, start_time, end_time, capacity, is_active, sort_order')
      .eq('is_deleted', false)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch time slots: ${error.message}`);
    }
    return data || [];
  }

  async findSlotById(id: string): Promise<DbTimeSlot | null> {
    const { data, error } = await this.supabase.client
      .from('time_slots')
      .select('id, slot_type_id, label, start_time, end_time, capacity, is_active, sort_order')
      .eq('id', id)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch slot by ID: ${error.message}`);
    }
    return data;
  }

  async createSlot(payload: {
    slotTypeId: string;
    label: string;
    startTime: string;
    endTime: string;
    capacity?: number;
    sortOrder?: number;
  }): Promise<DbTimeSlot> {
    const dataToInsert = {
      slot_type_id: payload.slotTypeId,
      label: payload.label,
      start_time: payload.startTime,
      end_time: payload.endTime,
      capacity: payload.capacity || null,
      sort_order: payload.sortOrder || 0,
    };

    const { data, error } = await this.supabase.client
      .from('time_slots')
      .insert([dataToInsert])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create slot: ${error.message}`);
    }
    return data;
  }

  async updateSlot(id: string, updates: {
    slotTypeId?: string;
    label?: string;
    startTime?: string;
    endTime?: string;
    capacity?: number;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<DbTimeSlot> {
    const dataToUpdate: any = {};
    if (updates.slotTypeId !== undefined) dataToUpdate.slot_type_id = updates.slotTypeId;
    if (updates.label !== undefined) dataToUpdate.label = updates.label;
    if (updates.startTime !== undefined) dataToUpdate.start_time = updates.startTime;
    if (updates.endTime !== undefined) dataToUpdate.end_time = updates.endTime;
    if (updates.capacity !== undefined) dataToUpdate.capacity = updates.capacity;
    if (updates.sortOrder !== undefined) dataToUpdate.sort_order = updates.sortOrder;
    if (updates.isActive !== undefined) dataToUpdate.is_active = updates.isActive;

    const { data, error } = await this.supabase.client
      .from('time_slots')
      .update(dataToUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update slot: ${error.message}`);
    }
    return data;
  }

  async deleteSlot(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('time_slots')
      .update({ is_deleted: true, is_active: false, deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete time slot: ${error.message}`);
    }
  }

  // --- Area Slot Availability & Availability Fetch ---
  async getAvailableSlotsByAreaAndDay(
    areaId: string,
    dayOfWeek: number,
    slotTypeCode: string,
  ): Promise<any[]> {
    // We join time_slots, area_slot_availability, and slot type lookups
    const { data, error } = await this.supabase.client
      .from('area_slot_availability')
      .select(`
        id,
        is_available,
        capacity_override,
        time_slots!inner(
          id,
          label,
          start_time,
          end_time,
          capacity,
          is_active,
          lookup_values!inner(code)
        )
      `)
      .eq('area_id', areaId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_deleted', false)
      .eq('is_available', true)
      .eq('time_slots.is_active', true)
      .eq('time_slots.is_deleted', false)
      .eq('time_slots.lookup_values.code', slotTypeCode);

    if (error) {
      throw new Error(`Failed to fetch availability mapping: ${error.message}`);
    }

    return (data || []).map((row: any) => {
      const slot = row.time_slots;
      return {
        availabilityId: row.id,
        slotId: slot.id,
        label: slot.label,
        startTime: slot.start_time,
        endTime: slot.end_time,
        capacity: row.capacity_override !== null ? row.capacity_override : slot.capacity,
      };
    });
  }

  async linkAreaSlot(payload: {
    areaId: string;
    slotId: string;
    dayOfWeek: number;
    isAvailable?: boolean;
    capacityOverride?: number;
  }): Promise<DbAreaSlotAvailability> {
    const dataToInsert = {
      area_id: payload.areaId,
      slot_id: payload.slotId,
      day_of_week: payload.dayOfWeek,
      is_available: payload.isAvailable !== undefined ? payload.isAvailable : true,
      capacity_override: payload.capacityOverride || null,
    };

    const { data, error } = await this.supabase.client
      .from('area_slot_availability')
      .insert([dataToInsert])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to map area slot availability: ${error.message}`);
    }
    return data;
  }
}
