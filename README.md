# 🛡️ NestJS OpenAPI Validation

[![npm version](https://badge.fury.io/js/nestjs-openapi-validation.svg)](https://badge.fury.io/js/nestjs-openapi-validation)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

> **Seamlessly validate your NestJS APIs using OpenAPI schemas with the power of Zod** 🚀

Transform your OpenAPI specifications into runtime validation with zero configuration. This library automatically converts your Swagger/OpenAPI schemas into Zod validators, ensuring your API requests are validated against the same schema that generates your documentation.

## ✨ Features

- 🔄 **Auto-sync validation** - Your OpenAPI docs and validation logic stay perfectly in sync
- ⚡ **Zero config** - Works out of the box with existing NestJS + Swagger setups
- 🛠️ **Zod-powered** - Leverage Zod's robust validation and error reporting
- 📚 **Rich validation** - Support for enums, unions, nested objects, arrays, and more
- 🔍 **Format validation** - Email, URL, date-time, and custom pattern validation
- 🎨 **Beautiful errors** - Clear, actionable validation error messages

## 🚀 Quick Start

### Installation

```bash
npm install nestjs-openapi-validation
# or
yarn add nestjs-openapi-validation
```

### Basic Setup

```jsonc
// package.json
{
  "scripts": {
    "dev": "nest start --watch --type-check",
  },
}
```

```jsonc
// nest-cli.json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "builder": {
      "type": "swc",
      "options": {
        "stripLeadingPaths": false,
        "includeDotfiles": true,
      },
    },
    "deleteOutDir": true,
    "plugins": [
      {
        "name": "@nestjs/swagger",
        "options": {
          "introspectComments": true,
        },
      },
    ],
  },
}
```

```typescript
// main.ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { OpenApiValidationPipe } from 'nestjs-openapi-validation';
// This is automatically generated thanks to the @nestjs/swagger plugin
// defined in nest-cli.json
import metadata from './metadata';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Build your OpenAPI document as usual
  const config = new DocumentBuilder()
    .setTitle('My API')
    .setDescription('API with automatic validation')
    .setVersion('1.0')
    .build();

  await SwaggerModule.loadPluginMetadata(metadata);
  const document = SwaggerModule.createDocument(app, config);

  // Add the validation pipe
  app.useGlobalPipes(
    new OpenApiValidationPipe(metadata, document),
    new ValidationPipe({ transform: true }),
  );

  await app.listen(3000);
}
```

### Define Your DTOs

```typescript
// user.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator',
}

export class CreateUserDto {
  @ApiProperty({ minLength: 2, maxLength: 50 })
  name: string;

  @ApiProperty({ format: 'email' })
  email: string;

  @ApiProperty({ minimum: 18, maximum: 120 })
  age: number;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty({ format: 'url' })
  website?: string;

  @ApiProperty({ pattern: /^[0-9]{10}$/.source })
  phone: string;

  tags?: string[];
}
```

**⚠️ note:** for simple properties, you do not need to decorate them with `@ApiProperty` thanks to `@nestjs/swagger` plugin defined in `nest-cli.json`, properties type and nullability are automatically extracted.

### Use in Controllers

```typescript
// user.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { CreateUserDto } from './user.dto';

@Controller('users')
export class UserController {
  @Post()
  createUser(@Body() userData: CreateUserDto) {
    // userData is automatically validated against your OpenAPI schema!
    return { message: 'User created', data: userData };
  }
}
```

## 🎯 Advanced Features

### Union Types & OneOf

```typescript
enum Status {
  active = 'ACTIVE',
  inactive = 'INACTIVE',
}

export class FlexibleQuery {
  @ApiProperty({
    oneOf: [{ enum: Object.values(Status) }, { type: 'string' }],
  })
  status: $`{Status}` | (string & {});

  @ApiProperty({
    oneOf: [
      { $ref: getSchemaPath(UserDto) },
      { $ref: getSchemaPath(AdminDto) }
    ]
  })
  profile: UserDto | AdminDto;
}
```

### Nested Objects & Arrays

```typescript
export class OrderDto {
  items: OrderItemDto[];
  customer: CustomerDto;
  orderDate: Date;
}
```

### Complex Validation Rules

```typescript
export class ProductDto {
  @ApiProperty({
    minLength: 3,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s-]+$/.source,
  })
  name: string;

  @ApiProperty({
    minimum: 0.01,
    maximum: 999999.99,
  })
  price: number;

  @ApiProperty({ format: 'url' })
  imageUrl: string;
}
```

### More

Check [src/modules/app/app.dto.ts](https://github.com/Akronae/nestjs-openapi-validation/blob/main/src/modules/app/app.dto.ts) to see all tested features.

## 📊 Validation Support Matrix

| OpenAPI Feature       | Supported | Zod Equivalent           |
| --------------------- | --------- | ------------------------ |
| `type: string`        | ✅        | `z.string()`             |
| `type: number`        | ✅        | `z.coerce.number()`      |
| `type: boolean`       | ✅        | `z.coerce.boolean()`     |
| `type: array`         | ✅        | `z.array()`              |
| `enum`                | ✅        | `z.enum()`               |
| `oneOf`               | ✅        | `z.union()`              |
| `$ref`                | ✅        | Nested schemas           |
| `format: email`       | ✅        | `z.string().email()`     |
| `format: url`         | ✅        | `z.string().url()`       |
| `format: date-time`   | ✅        | `z.string().datetime()`  |
| `minimum/maximum`     | ✅        | `z.number().min().max()` |
| `minLength/maxLength` | ✅        | `z.string().min().max()` |
| `pattern`             | ✅        | `z.string().regex()`     |
| `required` fields     | ✅        | Required vs optional     |

## 🔧 Configuration

The `OpenApiValidationPipe` accepts two parameters:

1. **metadata function** - Generated by NestJS CLI plugin
2. **OpenAPI document** - Your Swagger document object

```typescript
new OpenApiValidationPipe(
  metadata, // Metadata function
  document, // OpenAPI document
);
```

## 🚨 Error Handling

When validation fails, the pipe throws a `BadRequestException` with detailed Zod error information:

```json
{
  "statusCode": 400,
  "message": [
    {
      "code": "too_small",
      "minimum": 2,
      "type": "string",
      "inclusive": true,
      "exact": false,
      "message": "String must contain at least 2 character(s)",
      "path": ["name"]
    },
    {
      "validation": "email",
      "code": "invalid_string",
      "message": "Invalid email",
      "path": ["email"]
    }
  ],
  "error": "Bad Request"
}
```

## 🧪 Testing

The library includes comprehensive tests covering all validation scenarios:

```bash
# Run tests
npm test
```

Example test case:

```typescript
it('should validate email format', async () => {
  const res = await request(app.getHttpServer()).post('/users').send({
    name: 'John Doe',
    email: 'invalid-email', // This will fail
    age: 25,
  });

  expect(res.status).toBe(400);
  expect(res.body.message).toContain('Invalid email');
});
```

## 🛠️ Development

```bash
# Clone the repository
git clone https://github.com/akronae/nestjs-openapi-validation.git

# Install dependencies
yarn install

# Build the library
yarn lib:build

# Run tests
yarn test

# Start development server
yarn dev
```

## 📋 Requirements

- Node.js >= 16
- NestJS >= 10
- TypeScript >= 5.1
- Zod >= 3.25

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License

## 🙏 Acknowledgments

- Built on top of the amazing [Zod](https://github.com/colinhacks/zod) validation library

---

<div align="center">

**[⭐ Star this repo](https://github.com/akronae/nestjs-openapi-validation) if you find it useful!**

Made with ❤️ for the NestJS community

</div>
