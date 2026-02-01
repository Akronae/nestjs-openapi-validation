# 🛡️ NestJS OpenAPI Validation

[![npm version](https://badge.fury.io/js/nestjs-openapi-validation.svg)](https://badge.fury.io/js/nestjs-openapi-validation)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.1%2B-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16%2B-brightgreen)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10%2B-ea2845)](https://nestjs.com/)

---

> **Stop repeating yourself. Validate your NestJS applications using only TypeScript and OpenAPI.**

## Why use this?

In a standard NestJS project, defining a single property often requires you to write it **three times**:

1. **TypeScript:** `id: number;` (For type safety)
2. **Validation:** `@IsInt()` (For `class-validator`)
3. **Documentation:** `@ApiProperty()` (For Swagger/OpenAPI)

This is redundant, error-prone, and a nightmare to maintain. **nestjs-openapi-validation** uses TypeScript inference to automatically generate validation rules and OpenAPI schemas. For most properties, **the TypeScript definition is enough.**

---

## The "Before vs. After"

### ❌ The Standard Way (class-validator)

You have to manually sync decorators for every single field. Missing one `@Expose()` or `@IsNumber()` breaks your API or documentation.

```typescript
class Item {
  @Expose() // Needed for response transformation
  @Type(() => Number) // Needed to ensure it's a number
  @IsNumber() // Validation
  @Min(0) // Logic
  @ApiProperty({ minimum: 0 }) // Documentation
  size?: number;
}
```

### ✅ The `nestjs-openapi-validation` Way

The library infers the validation and documentation from your types and the `@OpenApiRegister()` decorator.

```typescript
@OpenApiRegister()
class Item {
  @ApiProperty({ minimum: 0 }) // Only add what can't be inferred
  size?: number;
}
```

---

## ✨ Features

- 🔄 **Auto-sync validation** - Your OpenAPI docs and validation logic stay perfectly in sync
- ⚡ **Zero config** - Works out of the box with existing NestJS + Swagger setups
- 🛠️ **Zod-powered** - Leverage Zod's robust validation and error reporting
- 📚 **Rich validation** - Support for enums, unions, nested objects, arrays, and more
- 🧯 **Prevent data leaks** - Blocks unexpected request fields so accidental extra fields (e.g., `passwordHash`, `internalNotes`) never leak
- 🛡️ **Strict user input validation** - Rejects user provided extra fields and enforces types/coercion so unintended data never reaches your code
- 🔍 **Format validation** - Email, URL, date-time, and custom pattern validation
- 🎨 **Beautiful errors** - Clear, actionable validation error messages

## 🚀 Quick Start

```bash
# Using npm
npm install nestjs-openapi-validation zod

# Using yarn
yarn add nestjs-openapi-validation zod

# Using pnpm
pnpm add nestjs-openapi-validation zod
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
// This is automatically generated thanks to @nestjs/swagger plugin
// defined in nest-cli.json
import metadata from './metadata';
import { AppModule } from './app.module';
import {
  OpenApiValidationInterceptor,
  OpenApiValidationPipe,
  getRegisteredOpenApiModels,
} from 'nestjs-openapi-validation';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('My API')
    .setDescription('API with automatic validation')
    .setVersion('1.0')
    .build();

  await SwaggerModule.loadPluginMetadata(metadata);
  const document = SwaggerModule.createDocument(app, config, {
    // Include models registered with @OpenApiRegister()
    extraModels: getRegisteredOpenApiModels(),
  });

  // Validate user input
  app.useGlobalPipes(new OpenApiValidationPipe(metadata, document));

  // Validate responses
  app.useGlobalInterceptors(
    new OpenApiValidationInterceptor(metadata, document),
  );

  await app.listen(3000);
}
```

### Define DTOs

```typescript
// user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { OpenApiRegister } from 'nestjs-openapi-validation';

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

// For DTOs not automatically discovered by the Swagger plugin
@OpenApiRegister()
export class SpecialUserDto {
  @ApiProperty({ minimum: 0, maximum: 120 })
  age?: number;

  name: string;
}
```

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

Complexe types are supported out of the box without decorators.

```typescript
export class OrderDto {
  items: OrderItemDto[];
  customer: CustomerDto;
  orderDate: Date;
  stringMatrix: string[][];
  deeply: {
    nested {
      value: true;
    }
  }
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
    maximum: 1000000,
  })
  price: number;

  @ApiProperty({
    minItems: 1,
    maxItems: 10,
    items: { type: 'string', maxLength: 50 },
  })
  tags: string[];

  @ApiProperty({ format: 'url' })
  imageUrl: string;
}
```

### More

Check [src/modules/app/app.dto.ts](https://github.com/Akronae/nestjs-openapi-validation/blob/main/src/modules/app/app.dto.ts) to see all tested features.

## Registering Models

If you see an error like:

```
YourDto is not registered in your OpenAPI document. Use `@OpenApiRegister()` on your DTO to register it.
```

it means the DTO is not automatically discovered by the NestJS Swagger plugin. This commonly happens when the DTO is only referenced in unions (`oneOf`), used in dynamic contexts, lives outside of scanned modules, or is only used as an input query and never returned.

Use the `@OpenApiRegister()` decorator on such DTOs, and pass the registered models to Swagger via `extraModels`:

## Ignoring Models

Use the `@OpenApiIgnore()` to skip specific model validation.

```ts
import { ApiProperty } from '@nestjs/swagger';
import {
  OpenApiRegister,
  getRegisteredOpenApiModels,
} from 'nestjs-openapi-validation';

@OpenApiRegister()
export class CustomDto {
  name: string;
  @ApiProperty({ minimum: 0, maximum: 120 })
  age?: number;
}

// main.ts (excerpt)
const document = SwaggerModule.createDocument(app, config, {
  extraModels: getRegisteredOpenApiModels(),
});
```

Once registered, request/response validation will work as expected for these models.

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

Both `OpenApiValidationPipe` and `OpenApiValidationInterceptor` accept two parameters:

1. **metadata function** — Generated by the `@nestjs/swagger` CLI plugin
2. **OpenAPI document** — Your Swagger document object

```typescript
new OpenApiValidationPipe(metadata, document);
new OpenApiValidationInterceptor(metadata, document);
```

## 🚨 Error Handling

On validation failures, the library returns HTTP 400 (Bad Request) with Zod errors grouped by location (e.g., `query`, `body`, or `response`). Each group contains an `issues` array describing the problems.

```jsonc
// Example error response (request validation)
{
  "error": {
    "query": {
      "issues": [
        {
          "code": "invalid_type",
          "expected": "string",
          "message": "required",
          "path": ["str1"],
          "received": "undefined",
        },
        {
          "code": "invalid_string",
          "message": "Invalid datetime",
          "path": ["date"],
          "validation": "datetime",
        },
      ],
    },
  },
}
```

The same structure applies to response validation, where issues would be reported under `response`.

## 🧪 Testing

The library includes comprehensive tests covering all validation scenarios:

```bash
# Run tests
# Using yarn
yarn test

# Using npm
npm test

# Using pnpm
pnpm test
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
2. Create a new branch for your feature or bugfix
3. Make your changes and write tests
4. Submit a pull request

## 📄 License

This project is [MIT licensed](LICENSE).

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/)
- [Zod](https://zod.dev/)
- [Swagger/OpenAPI](https://swagger.io/)

---

<div align="center">

**[⭐ Star this repo](https://github.com/akronae/nestjs-openapi-validation) if you find it useful!**

Made with ❤️ for the NestJS community

</div>
