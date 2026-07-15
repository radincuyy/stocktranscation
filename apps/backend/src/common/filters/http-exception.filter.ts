import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

export type ApiErrorResponse = {
  success: false;
  message: string;
  errors?: unknown;
  statusCode: number;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: unknown;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const body = exception.getResponse();

      if (typeof body === 'string') {
        message = body;
      } else if (body && typeof body === 'object') {
        const obj = body as Record<string, unknown>;
        const msg = obj.message;
        message = Array.isArray(msg)
          ? msg.join('; ')
          : typeof msg === 'string'
            ? msg
            : exception.message;
        errors = Array.isArray(msg) ? msg : obj.errors;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const payload: ApiErrorResponse = {
      success: false,
      message,
      statusCode,
      ...(errors !== undefined ? { errors } : {}),
    };

    response.status(statusCode).json(payload);
  }
}
