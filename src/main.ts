import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import metadata from './metadata';
import { AppModule } from './modules/app/app.module';
import { MetadataValidationPipe } from './modules/app/openapi-validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {});

  app.enableCors();

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  BigInt.prototype['toJSON'] = function () {
    return this.toString();
  };

  const config = new DocumentBuilder()
    .setTitle('Cats example')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('cats')
    .build();

  await SwaggerModule.loadPluginMetadata(metadata);
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(
    new MetadataValidationPipe(metadata, document),
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.listen(3001);
}
bootstrap();
