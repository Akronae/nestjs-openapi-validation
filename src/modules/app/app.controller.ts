import { Body, Controller, Get, Post, Query, Version } from '@nestjs/common';
import {
  Query1,
  Query10,
  Query2,
  Query3,
  Query4,
  Query5,
  Query6,
  Query7,
  Query8,
  Query9,
} from './app.dto';
import { AppService } from './app.service';

@Controller({
  version: '1',
})
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('status')
  getStatus() {
    return this.appService.getStatus();
  }

  @Get('status')
  @Version('2')
  getStatusV2() {
    return 'wow status version 2 wow';
  }

  @Get('query_1')
  getQuery1(@Query() query: Query1) {
    return query;
  }

  @Get('query_2')
  getQuery2(@Query() query: Query2) {
    return query;
  }

  @Get('query_3')
  getQuery3(@Query() query: Query3) {
    return query;
  }

  @Get('query_4')
  getQuery4(@Query() query: Query4) {
    return query;
  }

  @Post('query_5')
  getQuery5(@Body() query: Query5) {
    return query;
  }

  @Post('query_6')
  getQuery6(@Body() query: Query6) {
    return query;
  }

  @Post('query_7')
  getQuery7(@Body() query: Query7) {
    return query;
  }

  @Post('query_8')
  getQuery8(@Body() query: Query8) {
    return query;
  }

  @Post('query_9')
  getQuery9(@Body() query: Query9) {
    return query;
  }

  @Post('query_10')
  getQuery10(@Body() query: Query10) {
    return query;
  }

  @Get('response_1')
  getResponse1(@Query() body: any): Query1 {
    return body;
  }

  @Get('response_2')
  getResponse2(@Query() body: any): Query2 {
    return body;
  }

  @Get('response_3')
  getResponse3(@Query() body: any): Query3 {
    return body;
  }

  @Get('response_4')
  getResponse4(@Query() body: any): Query4 {
    return body;
  }

  @Post('response_5')
  getResponse5(@Body() body: any): Query5 {
    return body;
  }

  @Post('response_6')
  getResponse6(@Body() body: any): Query6 {
    return body;
  }

  @Post('response_7')
  getResponse7(@Body() body: any): Query7 {
    return body;
  }

  @Post('response_8')
  getResponse8(@Body() body: any): Query8 {
    return body;
  }

  @Post('response_9')
  getResponse9(@Body() body: any): Query9 {
    return body;
  }

  @Post('response_10')
  getResponse10(@Body() body: any): Query10 {
    return body;
  }
}
