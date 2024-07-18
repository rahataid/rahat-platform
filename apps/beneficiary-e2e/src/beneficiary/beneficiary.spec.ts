import request from 'supertest';
import { createBeneficiaryDto, createBulkBeneficiaryDto, listStats, tableStats } from './dummyData';

const baseUrl = "http://localhost:5500";

  // describe('POST /v1/beneficiary', () => {
  //   it('should create new beneficiary', async () => {
  //     const result = await request(baseUrl).post("/v1/beneficiaries").send(createBeneficiaryDto);
  //     // console.log(result, 'result post');
  //     expect(result.status).toBe(201);
  //     expect(result.body.data).toEqual(createBeneficiaryDto);
  //   });
  // });

  describe('GET /v1/beneficiaries', () => {
    it('should return list of beneficiaries', async () => {
      const params = {
        sort: 'age',
        order: 'asc',
        page: 1,
        perPage: 10,
        projectId: 'b89775b8-7a17-42e4-b32f-98a1ea39874e',
        gender: 'MALE',
        type: 'REFERRED'
      }
      const result = await request(baseUrl).get("/v1/beneficiaries").query(params);
      console.log(result.body, 'result get');
      expect(result.status).toBe(200);
      expect(result.body.data[0]).toEqual(createBeneficiaryDto);
    });
  });

  // describe('GET /v1/beneficiaries/uuid', () => {
  //   it('should return list of beneficiaries', async () => {
  //     const result = await request(baseUrl).get(`/v1/beneficiaries/${createBeneficiaryDto.uuid}`);
  //     // console.log(result.body, 'result get uuid');
  //     expect(result.status).toBe(200);
  //     expect(result.body.data).toEqual(createBeneficiaryDto);
  //   });
  // });

  // describe('GET /v1/beneficiaries/walletAddress', () => {
  //   it('should return list of beneficiaries', async () => {
  //     const result = await request(baseUrl).get(`/v1/beneficiaries/wallet/${createBeneficiaryDto.walletAddress}`);
  //     // console.log(result.body, 'result get wallet');
  //     expect(result.status).toBe(200);
  //     expect(result.body).toEqual(createBeneficiaryDto);
  //   });
  // });

  // describe('GET /v1/beneficiaries/phone', () => {
  //   it('should return beneficiary through phone', async () => {
  //     const result = await request(baseUrl).get(`/v1/beneficiaries/phone/${createBeneficiaryDto.piiData.phone}`);
  //     // console.log(result.body, 'result get phone');
  //     expect(result.status).toBe(200);
  //     expect(result.body.data).toEqual(createBeneficiaryDto);
  //   });
  // });

  // describe('GET /v1/beneficiaries/bulk', () => {
  //   it('should create beneficiaries in bulk', async () => {
  //     const result = await request(baseUrl).post("/v1/beneficiaries/bulk").send(createBulkBeneficiaryDto);
  //     // console.log(result.body, 'result post bulk');
  //     expect(result.status).toBe(201);
  //     expect(result.body.data).toEqual(createBulkBeneficiaryDto);
  //   });
  // });

  // describe('GET /v1/beneficiaries/pii', () => {
  //   it('should return list of piiDatas', async () => {
  //     const result = await request(baseUrl).get("/v1/beneficiaries/pii");
  //     // console.log(result.body.data[0], 'result get pii');
  //     expect(result.status).toBe(200);
  //     expect(result.body.data[0]).toEqual(createBeneficiaryDto.piiData);
  //   });
  // });

  // describe('GET /v1/beneficiaries/stats', () => {
  //   it('should return list of stats', async () => {
  //     const result = await request(baseUrl).get("/v1/beneficiaries/stats");
  //     // console.log(result.body.data, 'result get stats');
  //     expect(result.status).toBe(200);
  //     expect(result.body.data).toEqual(listStats);
  //   });
  // });

  // describe('GET /v1/beneficiaries/table-stats', () => {
  //   it('should return list of table stats', async () => {
  //     const result = await request(baseUrl).get("/v1/beneficiaries/table-stats");
  //     // console.log(result.body, 'result table stats');
  //     expect(result.status).toBe(200);
  //     expect(result.body.data).toEqual(tableStats);
  //   });
  // });

  // describe('GET /v1/beneficiaries/temp-groups', () => {
  //   it('should return list of temp groups', async () => {
  //     const params = {
  //       order: 'name',
  //       page: 1,
  //       perPage: 10,
  //       name: 'Demo'
  //     }; 
  //     const result = await request(baseUrl).get("/v1/beneficiaries/temp-groups/").query(params);
  //     console.log(result.body, 'request temp groups');
  //     expect(result.status).toBe(200);
  //   });
  // });

  // describe('GET /v1/beneficiaries/temp/uuid', () => {
  //   it('should return list of temp beneficiaries', async () => {
  //     const params = {
  //       order: 'desc',
  //       page: '1',
  //       perPage: 10,
  //       firstName: 'Ram',
  //       uuid: '5c788f0e-9869-4d5d-8f52-086a18da8fdf'
  //     };
  //     const result = await request(baseUrl).get(`/v1/beneficiaries/temp/${params.uuid}`).query(params);
  //     console.log(result, 'request temp beneficiaries');
  //     expect(result.status).toBe(200);
  //   });
  // });

  describe('POST /v1/beneficiaries/projects/uuid', () => {
    it('should post beneficiary to project', async () => {
      
    });
  });
