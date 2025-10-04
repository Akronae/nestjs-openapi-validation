import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { UserQuery1, UserQuery2, UserQuery3, UserQuery4 } from './users.dto';

@Controller({
  path: 'users',
  version: '1',
})
export class UsersController {
  @Get('query_1')
  getQuery1(@Query() query: UserQuery1) {
    return query;
  }
  @Get('response_1')
  getResponse1(@Query() query: any): UserQuery1 {
    return query;
  }

  @Post('query_2')
  getQuery2(@Body() body: UserQuery2) {
    return body;
  }
  @Post('response_2')
  getResponse2(@Body() body: any): UserQuery2 {
    return body;
  }

  @Get('query_3')
  getQuery3(@Query() _query: UserQuery3) {
    return 'ok!';
  }

  @Get('query_4')
  getQuery4(@Query() _query: UserQuery4) {
    return 'ok!';
  }

  @Get('query_5/:id')
  getQuery5(
    @Param('id') id: number,
    @Query('required') required: string,
    @Query('optional') optional?: string,
  ) {
    return {
      required,
      optional,
      id,
      lol: 1,
    };
  }
}
