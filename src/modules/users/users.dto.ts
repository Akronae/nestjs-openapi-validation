import { ApiProperty } from '@nestjs/swagger';

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
