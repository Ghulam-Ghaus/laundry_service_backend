import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RequestContextMiddleware } from '../middleware/request-context.middleware';

export interface ApiSuccessResponse<TData> {
  success: true;
  statusCode: number;
  message: string;
  data: TData;
  requestId: string;
  timestamp: string;
}

export interface ApiPaginatedResponse<TItem> {
  success: true;
  statusCode: number;
  message: string;
  data: TItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  requestId: string;
  timestamp: string;
}

@Injectable()
export class GlobalResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse();
    const statusCode = response.statusCode;
    const requestId = RequestContextMiddleware.getRequestId();
    const timestamp = new Date().toISOString();

    return next.handle().pipe(
      map((data) => {
        // If data is already in response shape, just return it
        if (data && typeof data === 'object' && 'success' in data && 'statusCode' in data) {
          return data;
        }

        const message = 'Request completed successfully';

        // Check if data is paginated (i.e. has items/data and pagination info)
        if (data && typeof data === 'object' && ('items' in data || 'data' in data) && 'pagination' in data) {
          const items = data.items || data.data;
          return {
            success: true,
            statusCode,
            message,
            data: items,
            pagination: {
              page: data.pagination.page || 1,
              limit: data.pagination.limit || 20,
              total: data.pagination.total || 0,
              totalPages: data.pagination.totalPages || Math.ceil((data.pagination.total || 0) / (data.pagination.limit || 20)),
            },
            requestId,
            timestamp,
          } as ApiPaginatedResponse<any>;
        }

        // Standard success response
        return {
          success: true,
          statusCode,
          message,
          data: data === undefined ? null : data,
          requestId,
          timestamp,
        } as ApiSuccessResponse<any>;
      }),
    );
  }
}
