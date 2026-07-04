import { Injectable } from '@nestjs/common';
import { LookupsQueries, DbLookupGroup, DbLookupValue } from './queries/lookups.queries';

@Injectable()
export class LookupsService {
  constructor(private readonly lookupsQueries: LookupsQueries) {}

  async getGroups(): Promise<DbLookupGroup[]> {
    return this.lookupsQueries.findGroups();
  }

  async getValuesByGroup(groupKey: string): Promise<DbLookupValue[]> {
    return this.lookupsQueries.findValuesByGroupKey(groupKey);
  }

  async getValueByCode(groupKey: string, code: string): Promise<DbLookupValue | null> {
    return this.lookupsQueries.findValueByCode(groupKey, code);
  }
}
