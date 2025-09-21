import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { OpenApiValidationPipe } from './openapi-validation.pipe';

@Injectable()
export class OpenApiResponseValidationInterceptor implements NestInterceptor {
  constructor(private readonly validator: OpenApiValidationPipe) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const url = req.url.split('?')[0];
    const schema =
      this.validator.openapi.paths[url][req.method.toLowerCase()].responses[
        res.statusCode ?? 200
      ].content[
        res.getHeader('content-type') ??
          req.headers['content-type'] ??
          'application/json'
      ].schema;

    const dtoName = schema?.$ref?.split('/').pop();
    if (!dtoName) return next.handle();

    return next.handle().pipe(
      map((data) => {
        return this.validator.validate(data, dtoName, 'response');
      }),
    );
  }
}
