import { ApiProperty } from '@nestjs/swagger';
import { OpenApiIgnore } from '../../lib/openapi-ignore.decorator';
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

@OpenApiRegister()
export class UserQuery7 {
  name: string;
  info: UserQuery7Info;
}

@OpenApiIgnore()
export class UserQuery7Info {
  age: number;
}

export class UserQuery8Info {
  name?: string | null;
}

@OpenApiRegister()
export class UserQuery8 {
  info: UserQuery8Info;
}
