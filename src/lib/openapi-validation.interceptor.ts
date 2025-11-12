import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { mapEntries } from 'radash';
import { Observable, map } from 'rxjs';
import z from 'zod';
import { getIgnoredOpenApiModels } from './openapi-ignore.decorator';
import { OpenApiValidator } from './openapi-validator';

@Injectable()
export class OpenApiValidationInterceptor
  extends OpenApiValidator
  implements NestInterceptor
{
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const url = req.route.path.replace(/:([a-zA-Z0-9_]+)/g, '{$1}');
    const endpoint = this.openapi.paths[url][req.method.toLowerCase()];
    const schema =
      endpoint.responses[res.statusCode ?? 200]?.content?.[
        res.getHeader('content-type') ??
          req.headers['content-type'] ??
          'application/json'
      ]?.schema;
    const dto: string = schema?.$ref?.split('/').pop();

    const inPath = endpoint.parameters?.filter((p) => p.in === 'path');
    if (inPath?.length) {
      const zReqParams = z.object(
        mapEntries(inPath, (_, v: any) => [
          v.name,
          this.openapiPropToZod({ required: v.required, ...v.schema }, {}),
        ]),
      );
      req.params = this.validate(req.params, zReqParams, 'param');
    }

    if (!dto || getIgnoredOpenApiModels().includes(dto)) return next.handle();

    return next.handle().pipe(
      map((data) => {
        return this.validate(data, { dto }, 'response');
      }),
    );
  }
}
