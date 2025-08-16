import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import metadata from '../../../src/metadata';
import { Query6 } from './app.dto';
import { AppModule } from './app.module';
import { AppService } from './app.service';
import { MetadataValidationPipe } from './openapi-validation.pipe';

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

    app.useGlobalPipes(
      new MetadataValidationPipe(metadata, document),
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    await app.init();
  });

  it('/query_1 fail (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/v1/query_1');
    expect(res.status).toBe(400);
    expect(res.body).toMatchSnapshot();
  });

  it('/query_1 success (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/v1/query_1').query({
      str1: 'lala',
      date: '2025',
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
          date: '2025-05-02',
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
            date: '2025-05-02',
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
    console.log(JSON.stringify(res.body, null, 2));

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
});
