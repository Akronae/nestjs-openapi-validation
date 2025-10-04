import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { OpenApiValidator } from './openapi-validator';

@Injectable()
export class OpenApiValidationPipe
  extends OpenApiValidator
  implements PipeTransform
{
  transform(value: any, metadata: ArgumentMetadata) {
    const dto = metadata.metatype?.name;

    if (!dto || !this.schemata[dto]) return value;

    if (!this.openapi.components?.schemas[dto]) {
      throw new Error(
        `${dto} is not registered in your OpenAPI document. Use \`@OpenApiRegister()\` on your DTO to register it. More info: https://github.com/Akronae/nestjs-openapi-validation?tab=readme-ov-file#registering-models.`,
      );
    }

    return this.validate(value, { dto }, metadata.type);
  }
}
