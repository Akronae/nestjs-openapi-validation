import { ApiProperty, getSchemaPath } from '@nestjs/swagger';

export class Query1 {
  str1: string;
  str2?: string;
  date: Date;
  nbr1: number;
  nbr2?: number;
}

export enum Enum1Enum {
  A = 'A',
  B = 'B',
  C = 'C',
}
export type Enum1 = `${Enum1Enum}`;

export class Query2 {
  str1: string;
  nbr1: number;
  @ApiProperty({ enum: Enum1Enum })
  enum1: Enum1;
}

export enum Enum2Enum {
  AA = 'AA',
  BB = 'BB',
  CC = 'CC',
}
export type Enum2 = `${Enum2Enum}`;
export class Query3 {
  @ApiProperty({
    oneOf: [
      { enum: [...Object.values(Enum1Enum)] },
      { enum: [...Object.values(Enum2Enum)] },
    ],
  })
  enum1: Enum1 | Enum2;
  @ApiProperty({
    oneOf: [{ enum: [...Object.values(Enum1Enum)] }, { type: 'string' }],
  })
  enum2: Enum1 | (string & {});
}

export class Query4 {
  query1: Query1;
  @ApiProperty({
    oneOf: [{ $ref: getSchemaPath(Query2) }, { $ref: getSchemaPath(Query3) }],
  })
  field2: Query2 | Query3;
}

export class Query5 {
  query4: Query4;
  force: boolean;
  query1?: Query1;
}

export class Query6 {
  arr: Query4[];
}

export class Query7 {
  @ApiProperty({ minLength: 1, maxLength: 10 })
  str: string;
  @ApiProperty({ minimum: -3, maximum: 23 })
  nbr: number;
  @ApiProperty({ format: 'email' })
  email: string;
  @ApiProperty({ format: 'url' })
  url: string;
  @ApiProperty({ pattern: /^[0-9]{10}$/.source })
  phone: string;
}
