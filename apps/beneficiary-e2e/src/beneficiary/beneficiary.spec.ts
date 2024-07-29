import request from 'supertest';
import { beneficiaryGroup, createBeneficiaryDto, createBeneficiaryGroupDto, createBulkBeneficiaryDto, groupUUID, listStats, projectUUID, singleGroup, tableStats, updateBeneficiaryDto } from './dummyData';

const baseUrl = "http://localhost:5500";

  describe('POST /v1/beneficiary', () => {
  it('should create new beneficiary', async () => {
      const result = await request(baseUrl).post("/v1/beneficiaries").send(createBeneficiaryDto);
      expect(result.status).toBe(201);
      expect(result.body.data).toEqual(createBeneficiaryDto);
      expect(result).toBeDefined();
    });
  });

  describe('GET /v1/beneficiaries', () => {
    it('should return list of beneficiaries', async () => {
      const params = {
        sort: 'age',
        order: 'asc',
        page: 1,
        perPage: 10,
        projectId: 'b89775b8-7a17-42e4-b32f-98a1ea39874e',
        gender: 'MALE',
        type: 'REFERRED',
      }
      const result = await request(baseUrl).get("/v1/beneficiaries").query(params);
      expect(result.status).toBe(200);
      expect(result.body.data).toEqual(createBulkBeneficiaryDto);
      expect(result).toBeDefined();
    });
  });

  describe('PATCH /v1/beneficiaries/uuid', () => {
    it('should update the beneficiaries details', async () => {
      const result = await request(baseUrl).patch(`/v1/beneficiaries/${createBeneficiaryDto.uuid}`).send(updateBeneficiaryDto);
      expect(result.status).toBe(200);
      expect(result.body.data).toEqual(updateBeneficiaryDto);
      expect(result).toBeDefined();
    });
  });

  describe('DELETE /v1/beneficiaries/uuid', () => {
    it('should delete the beneficiaries', async () => {
      const result = await request(baseUrl).delete(`/v1/beneficiaries/${createBeneficiaryDto.uuid}`);
      expect(result.status).toBe(200);
      expect(result).toHaveBeenCalledWith(createBeneficiaryDto.uuid);
    });
  });

  describe('PATCH /v1/beneficiaries/remove/uuid', () => {
    it('should update the deletedAt field of beneficiary', async () => {
      const result = await request(baseUrl).patch(`/v1/beneficiaries/remove/${createBeneficiaryDto.uuid}`);
      expect(result.status).toBe(200);
    });
  });

  describe('GET /v1/beneficiaries/uuid', () => {
    it('should return detail of beneficiary using uuid', async () => {
      const result = await request(baseUrl).get(`/v1/beneficiaries/${createBeneficiaryDto.uuid}`);
      expect(result.status).toBe(200);
      console.log(result.body);
      console.log(result.body.data, 'data');
      expect(result.body.data).toEqual(createBeneficiaryDto);
    });
  });

  describe('GET /v1/beneficiaries/walletAddress', () => {
    it('should return detail of beneficiary using wallet address', async () => {
      const result = await request(baseUrl).get(`/v1/beneficiaries/wallet/${createBeneficiaryDto.walletAddress}`);
      expect(result.status).toBe(200);
      expect(result.body).toEqual(createBeneficiaryDto);
    });
  });

  describe('GET /v1/beneficiaries/phone', () => {
    it('should return detail of beneficiary using phone', async () => {
      const result = await request(baseUrl).get(`/v1/beneficiaries/phone/${createBeneficiaryDto.piiData.phone}`);
      expect(result.status).toBe(200);
      expect(result.body.data).toEqual(createBeneficiaryDto);
    });
  });

  describe('POST /v1/beneficiaries/bulk', () => {
    it('should create beneficiaries in bulk', async () => {
      
        const result = await request(baseUrl).post("/v1/beneficiaries/bulk").send(createBulkBeneficiaryDto);
        console.log(result.body, 'result create bulk beneficiary');
        expect(result.status).toBe(201);
        expect(result.body.data).toEqual(createBulkBeneficiaryDto);
      
    });
  });

  describe('GET /v1/beneficiaries/pii', () => {
    it('should return list of piiDatas', async () => {
      const result = await request(baseUrl).get("/v1/beneficiaries/pii");
      expect(result.status).toBe(200);
      expect(result.body.data[0]).toEqual(createBeneficiaryDto.piiData);
    });
  });

  describe('GET /v1/beneficiaries/stats', () => {
    it('should return list of stats', async () => {
      const result = await request(baseUrl).get("/v1/beneficiaries/stats");
      expect(result.status).toBe(200);
      expect(result.body.data).toEqual(listStats);
    });
  });

  describe('GET /v1/beneficiaries/table-stats', () => {
    it('should return list of table stats', async () => {
      const result = await request(baseUrl).get("/v1/beneficiaries/table-stats");
      expect(result.status).toBe(200);
      expect(result.body.data).toEqual(tableStats);
    });
  });

  describe('POST /v1/beneficiaries/projects/uuid', () => {
    it('should add beneficiary to the project', async () => {
      const payload = { createBeneficiaryDto, projectUUID };
      const result = await request(baseUrl).post(`/v1/beneficiaries/projects/${createBeneficiaryDto.uuid}`).send(payload);
      expect(result.status).toBe(201);
    });
  });

  describe('POST /v1/beneficiaries/groups', () => {
    it('should add beneficiary to the group', async () => {
        const result = await request(baseUrl).post("/v1/beneficiaries/groups").send(createBeneficiaryGroupDto);
        expect(result.status).toBe(201);
        expect(result.body.data).toMatchObject(createBeneficiaryGroupDto);
    });
  });

  describe('GET /v1/beneficiaries/groups/uuid', () => {
    it('should return beneficiary from the group using uuid', async () => {
      const result = await request(baseUrl).get(`/v1/beneficiaries/groups/${groupUUID}`);
      expect(result.status).toBe(200);
      expect(result.body.data).toEqual(singleGroup);
    });
  });

  describe('GET /v1/beneficiaries/groups/all', () => {
    it('should return list of groups', async () => {
      const params = {
        sort: 'createdAt',
        order: 'asc',
        page: 1,
        perPage: 10,
        projectId: 'b89775b8-7a17-42e4-b32f-98a1ea39874e'
      };
      const result = await request(baseUrl).get("/v1/beneficiaries/groups/all").query(params);
      expect(result.status).toBe(200);
    });
  });

  describe('DELETE /v1/beneficiaries/groups/uuid', () => {
    it('should delete the group of beneficiaries using uuid', async () => {
      const result = await request(baseUrl).delete(`/v1/beneficiaries/groups/${beneficiaryGroup.uuid}`);
      expect(result.status).toBe(200);
      expect(result).toBeDefined();
      expect(result).toHaveBeenCalledWith(beneficiaryGroup.uuid);
    });
  });

  // describe('POST /v1/beneficiaries/import-tools', () => {
  //   it('should import beneficiaries from community tools', async () => {
  //     const result = await request(baseUrl).post("/v1/beneficiaries/import-tools");
  //   });
  // });

  

