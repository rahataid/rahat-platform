import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('BeneficiaryController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/beneficiaries (GET)', () => {
    const res = await request(app.getHttpServer())
      .get('/beneficiaries')
      .set(
        'Authorization',
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwic3ViIjp7ImVtYWlsIjoicmFnaGF2LmthdHRlbEBydW1zYW4ubmV0IiwibmFtZSI6IlJhZ2hhdiAtIEFkbWluIiwid2FsbGV0QWRkcmVzcyI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6WzE3MiwxMDcsMjUwLDI0MSwxNCwxMzcsMzIsNDQsNDEsNjEsMjE1LDE0OSwyMzYsMjI1LDEyOCwxODcsMjQxLDY3LDEzLDEyM119LCJyb2xlcyI6WyJBRE1JTiJdfSwiaWF0IjoxNzA0NzExODA3LCJleHAiOjIzMDk1MTE4MDd9.Oo6UNxDIsfDejqA7hOrZ_UXscXUfRl4u0aXzOgHV25M',
      );
    const body = res.body;
    console.log('body', body);
  });

  afterAll(async () => {
    await app.close();
  });
});
