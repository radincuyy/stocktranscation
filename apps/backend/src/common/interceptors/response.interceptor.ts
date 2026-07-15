import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

export type ApiSuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
};

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiSuccessResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiSuccessResponse<T>> {
    return next.handle().pipe(
      map((payload) => {
        if (
          payload &&
          typeof payload === 'object' &&
          'success' in payload &&
          'data' in payload
        ) {
          return payload as ApiSuccessResponse<T>;
        }

        if (
          payload &&
          typeof payload === 'object' &&
          'data' in payload &&
          'message' in payload
        ) {
          const { data, message, meta, ...rest } = payload as {
            data: T;
            message?: string;
            meta?: Record<string, unknown>;
          } & Record<string, unknown>;

          return {
            success: true as const,
            message: message ?? 'OK',
            data,
            ...(meta ? { meta } : Object.keys(rest).length ? { meta: rest } : {}),
          };
        }

        return {
          success: true as const,
          message: 'OK',
          data: payload as T,
        };
      }),
    );
  }
}
