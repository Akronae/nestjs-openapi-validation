import { ApiExtraModels } from '@nestjs/swagger';

const ignoredModels: string[] = [];

export function OpenApiIgnore(): ClassDecorator {
  return (target: any) => {
    ignoredModels.push(target.name);
    ApiExtraModels()(target);
  };
}

export function getIgnoredOpenApiModels() {
  return ignoredModels;
}
