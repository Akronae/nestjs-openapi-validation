import { ApiExtraModels } from '@nestjs/swagger';

const registeredModels: any[] = [];

export function OpenApiRegister(): ClassDecorator {
  return (target: any) => {
    registeredModels.push(target);
    ApiExtraModels()(target);
  };
}

export function getRegisteredOpenApiModels() {
  return registeredModels;
}
