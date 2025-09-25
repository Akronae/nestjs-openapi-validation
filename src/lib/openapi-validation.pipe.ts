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

    if (!this.openapi.components?.schemas[dtoName]) {
      throw new Error(
        `${dtoName} is not registered in your OpenAPI document. Use \`@OpenApiRegister()\` on your DTO to register it. More info: https://github.com/Akronae/nestjs-openapi-validation?tab=readme-ov-file#registering-models.`,
      );
    }

    return this.validate(value, dtoName, metadata.type);
  }
}
