import { ApiProperty } from '@nestjs/swagger';
import { OpenApiRegister } from '../../lib/openapi-register.decorator';

export class UserQuery1 {
  name: string;
  @ApiProperty({ minimum: 0, maximum: 120 })
  age?: number;
}

export class UserQuery2Options {
  all: string;
}

export class UserQuery2 {
  name: string;
  options?: UserQuery2Options;
}

@OpenApiRegister()
export class UserQuery3 {
  a: string;
  @ApiProperty({ minimum: 0, maximum: 120 })
  b?: number;
}

@OpenApiRegister()
export class UserQuery4 {
  required: string;
}

@OpenApiRegister()
export class UserQuery6 {
  force?: boolean;
}
