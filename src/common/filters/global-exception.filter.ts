import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { RequestContextMiddleware } from '../middleware/request-context.middleware';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const requestId = RequestContextMiddleware.getRequestId();
    const timestamp = new Date().toISOString();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let details: unknown = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || exception.message;
        // Check standard validation shape vs custom error shape
        errorCode = (exceptionResponse as any).errorCode || (exceptionResponse as any).error || 'HTTP_ERROR';
        details = (exceptionResponse as any).details || (exceptionResponse as any).message || null;
      } else {
        message = exception.message;
        errorCode = 'HTTP_ERROR';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(`Unhandled Exception: ${exception.message}`, exception.stack);
    } else {
      this.logger.error(`Unknown Exception Type Caught: ${JSON.stringify(exception)}`);
    }

    // Standardize error message (e.g. format array validation errors)
    const displayMessage = Array.isArray(message) ? message[0] : message;
    const finalErrorCode = typeof errorCode === 'string' 
      ? errorCode.toUpperCase().replace(/\s+/g, '_')
      : 'HTTP_ERROR';

    response.status(status).json({
      success: false,
      statusCode: status,
      message: displayMessage,
      errorCode: finalErrorCode,
      requestId,
      timestamp,
      details: Array.isArray(message) ? message : details,
    });
  }
}
