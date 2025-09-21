import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import metadata from '../../../src/metadata';
import { OpenApiValidationInterceptor } from '../../lib/openapi-validation.interceptor';
import { OpenApiValidationPipe } from '../../lib/openapi-validation.pipe';
import { Query10, Query6, Query7, Query8, Query9 } from './app.dto';
import { AppModule } from './app.module';
import { AppService } from './app.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const mod: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [AppService],
    }).compile();
    app = mod.createNestApplication();

    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });

    const config = new DocumentBuilder()
      .setTitle('API docs')
      .setDescription('The API description')
      .setVersion('1.0')
      .build();

    await SwaggerModule.loadPluginMetadata(metadata);
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    const validatorPipe = new OpenApiValidationPipe(metadata, document);
    app.useGlobalPipes(
      validatorPipe,
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    app.useGlobalInterceptors(
      new OpenApiValidationInterceptor(metadata, document),
    );

    await app.init();
  });

  it('/query_1 fail (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/v1/query_1');
    expect(res.status).toBe(400);
    expect(res.body).toMatchSnapshot();
  });

  it('/query_1 success (GET)', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/query_1')
      .query({
        str1: 'lala',
        date: new Date('2025'),
        nbr1: 123,
      });
    expect(res.status).toBe(200);
    expect(res.body).toMatchSnapshot();
  });

  it('/query_2 fail (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/v1/query_2').query({
      str1: 'lala',
    });
    expect(res.status).toBe(400);
    expect(res.body).toMatchSnapshot();
  });

  it('/query_2 success (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/v1/query_2').query({
      str1: 'lala',
      nbr1: 123,
      enum1: 'A',
    });
    expect(res.status).toBe(200);
    expect(res.body).toMatchSnapshot();
  });

  it('/query_3 fail (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/v1/query_3').query({
      str1: 'lala',
    });
    expect(res.status).toBe(400);
    expect(res.body).toMatchSnapshot();
  });

  it('/query_3 success (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/v1/query_3').query({
      str1: 'lala',
      enum2: 'okok',
      enum1: 'BB',
    });
    expect(res.status).toBe(200);
    expect(res.body).toMatchSnapshot();
  });

  it('/query_4 fail (GET)', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/query_4')
      .query({
        query1: { a: 1 },
        query2: { a: 1 },
      });
    expect(res.status).toBe(400);
    expect(res.body).toMatchSnapshot();
  });

  it('/query_4 success (GET)', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/query_4')
      .query({
        query1: {
          str1: 'ahah',
          date: new Date('2025-05-02'),
          nbr1: 99,
        },
        field2: {
          str1: '!!!',
          enum2: 'okok',
          enum1: 'A',
        },
      });
    expect(res.status).toBe(200);
    expect(res.body).toMatchSnapshot();
  });

  it('/query_5 success (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/query_5')
      .send({
        query4: {
          query1: {
            str1: 'ahah',
            date: new Date('2025-05-02'),
            nbr1: 99,
          },
          field2: {
            str1: '!!!',
            enum2: 'okok',
            enum1: 'A',
          },
        },
        force: false,
      });
    expect(res.status).toBe(201);
    expect(res.body).toMatchSnapshot();
  });

  it('/query_5 fail (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/query_5')
      .send({
        query4: {
          query1: {
            str1: 'ahah',
            date: '2025-05-aa',
            nbr1: '99',
          },
          field2: {
            str1: '!!!',
            enum2: 'okok',
            enum1: 'D',
          },
        },
        force: true,
      });
    expect(res.status).toBe(400);
    expect(res.body).toMatchSnapshot();
  });

  it('/query_6 success (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/query_6')
      .send({
        arr: [
          {
            field2: { enum1: 'A', str1: 'lala', nbr1: 123 },
            query1: { str1: 'lalala', date: new Date('2025-05-02'), nbr1: 999 },
          },
          {
            field2: { enum1: 'AA', enum2: 'Aahah' },
            query1: { str1: 'lalala', date: new Date('2025-10-02'), nbr1: 111 },
          },
        ],
      } satisfies Query6);

    expect(res.status).toBe(201);
    expect(res.body).toMatchSnapshot();
  });

  it('/query_6 fail (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/query_6')
      .send({
        arr: [
          {
            field2: { enum1: 'A', str1: 'lala', nbr1: 123 },
            query1: { str1: 'lalala', date: new Date('2025-05-02'), nbr1: 999 },
          },
          {
            field2: { enum1: 'AAA', enum2: 'A' },
            query1: { str1: 'lalala', date: new Date('2025-10-02'), nbr1: 111 },
          },
        ],
      });
    expect(res.status).toBe(400);
    expect(res.body).toMatchSnapshot();
  });

  it('/query_7 success (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/query_7')
      .send({
        str: 'hello',
        nbr: 14,
        email: 'hey@hey.com',
        url: 'https://google.com',
        phone: '1234567894',
      } satisfies Query7);

    expect(res.status).toBe(201);
    expect(res.body).toMatchSnapshot();
  });

  it('/query_7 fail (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/query_7')
      .send({
        str: 'a',
        nbr: -10,
        email: 'hey',
        url: 'google',
        phone: '12',
      } satisfies Query7);

    expect(res.status).toBe(400);
    expect(res.body).toMatchSnapshot();
  });

  it('/query_7 fail (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/query_7')
      .send({
        str: 'hellooooooooooooooooooooooooooooooooooo',
        nbr: 140000,
        email: 'hey@hey.com',
        url: 'https://google.com',
        phone: '1234567894',
      } satisfies Query7);

    expect(res.status).toBe(400);
    expect(res.body).toMatchSnapshot();
  });

  it('/query_8 success (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/query_8')
      .send({
        nested: {
          long: {
            prop: 21,
          },
        },
      } satisfies Query8);

    expect(res.status).toBe(201);
    expect(res.body).toMatchSnapshot();
  });
  it('/query_8 fail (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/query_8')
      .send({
        nested: {
          long: {
            prop: 'BB' as any,
          },
        },
      } satisfies Query8);

    expect(res.status).toBe(400);
    expect(res.body).toMatchSnapshot();
  });

  it('/query_9 success (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/query_9')
      .send({
        required: {
          long: { prop: 21 },
          semi: {},
        },
      } satisfies Query9);

    expect(res.status).toBe(201);
    expect(res.body).toMatchSnapshot();
  });
  it('/query_9 success (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/query_9')
      .send({
        required: {
          long: { prop: 21 },
        },
      } satisfies Query9);

    expect(res.status).toBe(201);
    expect(res.body).toMatchSnapshot();
  });
  it('/query_9 fail (POST)', async () => {
    const res = await request(app.getHttpServer()).post('/v1/query_9').send({});

    expect(res.status).toBe(400);
    expect(res.body).toMatchSnapshot();
  });
  it('/query_9 fail (POST)', async () => {
    const res = await request(app.getHttpServer()).post('/v1/query_9').send({
      required: {},
    });

    expect(res.status).toBe(400);
    expect(res.body).toMatchSnapshot();
  });
  it('/query_9 fail (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/query_9')
      .send({
        required: {
          long: 31,
        },
      });

    expect(res.status).toBe(400);
    expect(res.body).toMatchSnapshot();
  });
  it('/query_9 fail (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/query_9')
      .send({
        required: {
          long: { prop: 'dd' },
        },
      });

    expect(res.status).toBe(400);
    expect(res.body).toMatchSnapshot();
  });
  it('/query_9 fail (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/query_9')
      .send({
        required: {
          long: { prop: 21 },
        },
        opt: {},
      });

    expect(res.status).toBe(400);
    expect(res.body).toMatchSnapshot();
  });
  it('/query_9 fail (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/query_9')
      .send({
        required: {
          long: { prop: 21 },
        },
        opt: { long: {} },
      });

    expect(res.status).toBe(400);
    expect(res.body).toMatchSnapshot();
  });
  it('/query_9 fail (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/query_9')
      .send({
        required: {
          long: { prop: 21 },
        },
        opt: { long: { prop: 'dsdd' } },
      });

    expect(res.status).toBe(400);
    expect(res.body).toMatchSnapshot();
  });
  it('/query_9 fail (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/query_9')
      .send({
        required: {
          long: { prop: 21 },
          opt: {},
        },
      });

    expect(res.status).toBe(400);
    expect(res.body).toMatchSnapshot();
  });
  it('/query_9 success (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/query_9')
      .send({
        required: {
          long: { prop: 21 },
        },
        opt: { long: { prop: 21 } },
      } satisfies Query9);

    expect(res.status).toBe(201);
    expect(res.body).toMatchSnapshot();
  });

  it('/query_10 success (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/query_10')
      .send({
        arr2d: [
          ['a', 'b'],
          ['c', 'd'],
        ],
      } satisfies Query10);

    expect(res.status).toBe(201);
    expect(res.body).toMatchSnapshot();
  });

  it('/query_10 fail (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/query_10')
      .send({
        arr2d: [['a', 'b'], ['c']],
        arr2d2: [
          [1, 2, 3],
          [4, 5, 'dnds' as any],
        ],
      } satisfies Query10);

    expect(res.status).toBe(400);
    expect(res.body).toMatchSnapshot();
  });

  it('/response_1 fail (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/v1/response_1');
    expect(res.status).toBe(400);
    expect(res.body).toMatchSnapshot();
  });

  it('/response_1 success (GET)', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/response_1')
      .query({
        str1: 'lala',
        date: new Date('2025'),
        nbr1: 123,
      });
    expect(res.status).toBe(200);
    expect(res.body).toMatchSnapshot();
  });

  it('/response_2 fail (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/v1/response_2').query({
      str1: 'lala', // missing required nbr1 or enum1
    });
    expect(res.status).toBe(400);
    expect(res.body).toMatchSnapshot();
  });

  it('/response_2 success (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/v1/response_2').query({
      str1: 'test',
      nbr1: 42,
      enum1: 'A',
    });
    expect(res.status).toBe(200);
    expect(res.body).toMatchSnapshot();
  });

  it('/response_3 fail (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/v1/response_3').query({
      str1: 'wrong', // missing enums or invalid enum
    });
    expect(res.status).toBe(400);
    expect(res.body).toMatchSnapshot();
  });

  it('/response_3 success (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/v1/response_3').query({
      str1: 'hello',
      enum1: 'BB',
      enum2: 'okok',
    });
    expect(res.status).toBe(200);
    expect(res.body).toMatchSnapshot();
  });

  it('/response_4 fail (GET)', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/response_4')
      .query({
        query1: { a: 1 },
        field2: { a: 1 },
      });
    expect(res.status).toBe(400);
    expect(res.body).toMatchSnapshot();
  });

  it('/response_4 success (GET)', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/response_4')
      .query({
        query1: {
          str1: 'ok',
          date: new Date('2025-06-01'),
          nbr1: 10,
        },
        field2: {
          str1: 'yay',
          enum1: 'A',
          enum2: 'okok',
        },
      });
    expect(res.status).toBe(200);
    expect(res.body).toMatchSnapshot();
  });

  it('/response_5 fail (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/response_5')
      .send({
        query4: {
          query1: { str1: 'fail', date: 'invalid', nbr1: 'abc' },
          field2: { str1: '!!!', enum1: 'Z', enum2: 'bad' },
        },
      });
    expect(res.status).toBe(400);
    expect(res.body).toMatchSnapshot();
  });

  it('/response_5 success (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/response_5')
      .send({
        query4: {
          query1: { str1: 'ok', date: new Date('2025-06-01'), nbr1: 123 },
          field2: { str1: 'good', enum1: 'A', enum2: 'okok' },
        },
        force: true,
      });
    expect(res.status).toBe(201);
    expect(res.body).toMatchSnapshot();
  });

  it('/response_6 success (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/response_6')
      .send({
        arr: [
          {
            query1: { str1: 'abc', date: new Date('2025-01-01'), nbr1: 1 },
            field2: { str1: 'x', enum1: 'A', nbr1: 2 },
          },
          {
            query1: { str1: 'def', date: new Date('2025-02-01'), nbr1: 3 },
            field2: { enum1: 'AA', enum2: 'okok' },
          },
        ],
      } satisfies Query6);
    expect(res.status).toBe(201);
    expect(res.body).toMatchSnapshot();
  });

  it('/response_6 fail (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/response_6')
      .send({
        arr: [
          {
            query1: { str1: 'abc', date: new Date('2025-01-01'), nbr1: 1 },
            field2: { enum1: 'INVALID' as any },
          },
        ],
      });
    expect(res.status).toBe(400);
    expect(res.body).toMatchSnapshot();
  });

  it('/response_7 fail (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/response_7')
      .send({
        str: '',
        nbr: -5,
        email: 'invalid',
        url: 'not-a-url',
        phone: '123',
      } satisfies Query7);
    expect(res.status).toBe(400);
    expect(res.body).toMatchSnapshot();
  });

  it('/response_7 success (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/response_7')
      .send({
        str: 'most 10',
        nbr: 10,
        email: 'test@example.com',
        url: 'https://example.com',
        phone: '1234567890',
      } satisfies Query7);
    console.log(res.body);
    expect(res.status).toBe(201);
    expect(res.body).toMatchSnapshot();
  });

  it('/response_8 fail (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/response_8')
      .send({
        nested: { long: { prop: 'wrong' as any } },
      } satisfies Query8);
    expect(res.status).toBe(400);
    expect(res.body).toMatchSnapshot();
  });

  it('/response_8 success (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/response_8')
      .send({
        nested: { long: { prop: 42 } },
      } satisfies Query8);
    expect(res.status).toBe(201);
    expect(res.body).toMatchSnapshot();
  });

  it('/response_9 fail (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/response_9')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body).toMatchSnapshot();
  });

  it('/response_9 success (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/response_9')
      .send({
        required: { long: { prop: 21 } },
        opt: { long: { prop: 21 } },
      } satisfies Query9);
    expect(res.status).toBe(201);
    expect(res.body).toMatchSnapshot();
  });

  it('/response_10 fail (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/response_10')
      .send({
        arr2d: [['a'], ['b', 'c', 'd']],
        arr2d2: [
          [1, 2],
          [3, 'wrong' as any],
        ],
      } satisfies Query10);
    expect(res.status).toBe(400);
    expect(res.body).toMatchSnapshot();
  });

  it('/response_10 success (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/response_10')
      .send({
        arr2d: [
          ['a', 'b'],
          ['c', 'd'],
        ],
        arr2d2: [
          [1, 2, 3],
          [4, 5, 6],
        ],
      } satisfies Query10);
    expect(res.status).toBe(201);
    expect(res.body).toMatchSnapshot();
  });
});
