import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { OpenApiValidator } from './openapi-validator';

@Injectable()
export class OpenApiValidationPipe
  extends OpenApiValidator
  implements PipeTransform
{
  transform(value: any, metadata: ArgumentMetadata) {
    const dtoName = metadata.metatype?.name;
    if (!dtoName || !this.schemata[dtoName]) return value;

    return this.validate(value, dtoName, metadata.type);
  }
}
