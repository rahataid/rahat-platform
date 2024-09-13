import { getBeneficiaryClient } from '../../clients/beneficiary.client';
import { Beneficiary } from '../../beneficiary';
import axios from 'axios';
import { Pagination } from '@rumsan/sdk/types';
import { randomUUID } from 'crypto';

jest.mock('axios');

const mockAxiosInstance = axios as jest.Mocked<typeof axios>;

describe('BeneficiaryClient', () => {
  const client = getBeneficiaryClient(mockAxiosInstance);

  describe('create', () => {
    it('should create a new beneficiary', async () => {
      const mockRequest = {
        birthDate: new Date('2024-09-05T06:27:57.136Z'),
        age: 20,
        gender: 'FEMALE',
        location: 'abc',
        latitude: 26.24,
        longitude: 86.24,
        notes: 'notes',
        walletAddress: '0x00',
        extras: {
          hasCitizenship: true,
          passportNumber: '1234567',
          email: 'test@mailinator.com',
        },
        bankedStatus: 'BANKED',
        internetStatus: 'HOME_INTERNET',
        phoneStatus: 'FEATURE_PHONE',
        piiData: {
          name: 'Test Test',
          phone: '9800000',
          extras: {
            bank: 'Bank',
            account: 'account',
          },
        },
        projectUUIDs: [randomUUID()],
        id: 'mock-beneficiary-id',
      };
      const mockResponse = {
        success: true,
        data: mockRequest,
      };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);
      const result = await client.create(mockRequest as Beneficiary);
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/beneficiaries', mockRequest, undefined);
      expect(result.httpReponse).toEqual(mockResponse);
    });
  });

  describe('createBulk', () => {
    it('should create beneficiaries in bulk', async () => {
        const mockRequest = [{
            birthDate: new Date('2024-09-05T06:27:57.136Z'),
            age: 20,
            gender: 'FEMALE',
            location: 'abc',
            latitude: 26.24,
            longitude: 86.24,
            notes: 'notes',
            walletAddress: '0x00',
            extras: {
              hasCitizenship: true,
              passportNumber: '1234567',
              email: 'test@mailinator.com',
            },
            bankedStatus: 'BANKED',
            internetStatus: 'HOME_INTERNET',
            phoneStatus: 'FEATURE_PHONE',
            piiData: {
              name: 'Test Test',
              phone: '9800000',
              extras: {
                bank: 'Bank',
                account: 'account',
              },
            },
            projectUUIDs: [randomUUID()],
            id: 'mock-beneficiary-id',
          },
          {
            birthDate: new Date('2024-09-05T06:27:57.136Z'),
            age: 20,
            gender: 'FEMALE',
            location: 'xyz',
            latitude: 26.24,
            longitude: 86.24,
            notes: 'notes',
            walletAddress: '0x00',
            extras: {
              hasCitizenship: true,
              passportNumber: '1234567',
              email: 'test@mailinator.com',
            },
            bankedStatus: 'BANKED',
            internetStatus: 'HOME_INTERNET',
            phoneStatus: 'FEATURE_PHONE',
            piiData: {
              name: 'Test Test',
              phone: '9800000',
              extras: {
                bank: 'Bank',
                account: 'account',
              },
            },
            projectUUIDs: [randomUUID()],
            id: 'mock-beneficiary-id',
          }];
          const mockResponse = {
            success: true,
            data: mockRequest,
          };
          mockAxiosInstance.post.mockResolvedValue(mockResponse);
          const result = await client.createBulk(mockRequest as Beneficiary[]);
          expect(mockAxiosInstance.post).toHaveBeenCalledWith('/beneficiaries/bulk', mockRequest, undefined);
          expect(result.httpReponse).toEqual(mockResponse);
    });
  });

  describe('getStats', () => {
    it('should return list of stats', async () => {
      const mockResponse = {
          success: true,
          data: [
            {
              name: "BENEFICIARY_BANKEDSTATUS",
              data: [
                {
                  id: "BANKED",
                  count: 2
                }
              ]
            },
            {
              name: "BENEFICIARY_AGE_RANGE",
              data: [
                {
                  id: "0-20",
                  count: 2
                },
                {
                  id: "20-40",
                  count: 0
                },
                {
                  id: "40-60",
                  count: 0
                },
                {
                  id: "60+",
                  count: 0
                }
              ]
            }
          ]
        };
        mockAxiosInstance.get.mockResolvedValue(mockResponse);
        const result = await client.getStats();
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/beneficiaries/stats', undefined);
        expect(result.response).toEqual(mockResponse.data);
    });
  });

  describe('list', () => {
    it('should return list of beneficiaries', async () => {
      const data: Pagination = {
        sort: 'gender',
        order: 'asc',
        page: 1,
        perPage: 10
      };
      const mockResponse = {
        success: 'true',
        data: [
          {
            id: 1,
            uuid: randomUUID(),
            gender: "FEMALE",
            walletAddress: "0x00",
            birthDate: "1997-03-08T00:00:00.000Z",
            age: 20,
            location: "xyz",
            latitude: 26.24,
            longitude: 86.24,
            extras: {
              email: "test@mailinator.com",
              hasCitizenship: true,
              passportNumber: "1234567"
            },
            notes: "9785623749",
            bankedStatus: "BANKED",
            internetStatus: "HOME_INTERNET",
            phoneStatus: "FEATURE_PHONE",
            createdAt: "2024-09-03T16:15:32.098Z",
            updatedAt: "2024-09-03T16:15:32.098Z",
            deletedAt: null,
            isVerified: false,
            BeneficiaryProject: [],
            piiData: {
              beneficiaryId: 1,
              name: "ABC",
              phone: "9898",
              email: null,
              extras: {
                bank: "Bank",
                account: "9872200001"
              }
            }
          },
          {
            id: 2,
            uuid: randomUUID(),
            gender: "FEMALE",
            walletAddress: "0x00",
            birthDate: "1997-03-08T00:00:00.000Z",
            age: 20,
            location: "abc",
            latitude: 26.24,
            longitude: 86.24,
            extras: {
              email: "test@mailinator.com",
              hasCitizenship: true,
              passportNumber: "1234567"
            },
            notes: "9785623749",
            bankedStatus: "BANKED",
            internetStatus: "HOME_INTERNET",
            phoneStatus: "FEATURE_PHONE",
            createdAt: "2024-09-03T16:15:32.098Z",
            updatedAt: "2024-09-03T16:15:32.098Z",
            deletedAt: null,
            isVerified: false,
            BeneficiaryProject: [],
            piiData: {
              beneficiaryId: 1,
              name: "XYZ",
              phone: "989898",
              email: null,
              extras: {
                bank: "Bank",
                account: "9872200001"
              }
            }
          }
        ],
        meta: {
          total: 2,
          lastPage: 1,
          currentPage: 1,
          perPage: 10,
          prev: null,
          next: null
        }
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);
      const result = await client.list(data); 
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/beneficiaries', {params: data});
      expect(result.httpReponse).toEqual(mockResponse);
    });
  });

  describe('listPiiData', () => {
    it('should return list of beneficiary piiData', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            piiData: {
              beneficiaryId: 1,
              name: "ABC",
              phone: "9898",
              email: null,
              extras: {
                bank: "Bank",
                account: "9872200001"
              }
            }
          },
          {
            piiData: {
              beneficiaryId: 2,
              name: "XYZ",
              phone: "989898",
              email: null,
              extras: {
                bank: "Bank",
                account: "9872200001"
              }
            }
          }
        ],
        meta: {
          total: 2,
          lastPage: 1,
          currentPage: 1,
          perPage: 2,
          prev: null,
          next: null
        }
      };
      
      const paramData: Pagination = {
        order: "asc",
        page: 1,
        perPage: 10,
        sort: "gender"
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);
      const result = await client.listPiiData(paramData);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/beneficiaries/pii', { params: paramData });
      expect(result.httpReponse).toEqual(mockResponse);
    });
  });

  describe('get', () => {
    it('should return specific beneficiary as per UUID', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 2,
          uuid: randomUUID(),
          gender: "FEMALE",
          walletAddress: "0x00",
          birthDate: "1997-03-08T00:00:00.000Z",
          age: 20,
          location: "lalitpur",
          latitude: 26.24,
          longitude: 86.24,
          extras: {
            email: "test@mailinator.com",
            hasCitizenship: true,
            passportNumber: "1234567"
          },
          notes: "9785623749",
          bankedStatus: "BANKED",
          internetStatus: "HOME_INTERNET",
          phoneStatus: "FEATURE_PHONE",
          createdAt: "2024-09-09T10:38:19.380Z",
          updatedAt: "2024-09-09T10:38:19.380Z",
          deletedAt: null,
          isVerified: false,
          BeneficiaryProject: [],
          piiData: {
            beneficiaryId: 2,
            name: "ABC",
            phone: "9898",
            email: null,
            extras: {
              bank: "Bank",
              account: "9872200001"
            }
          }
        }
      };
      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);
      const result = await client.get(mockResponse.data.uuid);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/beneficiaries/${mockResponse.data.uuid}`, undefined );
      expect(result.httpReponse).toEqual(mockResponse);
    });
  });

  describe('update', () => {
    it('should update the specific beneficiary details as per uuid', async () => {
      const dto = {
        age: 28,
        extras: {
          hasCitizenship: false
        },
        piiData: {
          phone: '9898848498'
        }
      };
      const mockResponse = {
        success: true,
        data: {
          id: 2,
          uuid: randomUUID(),
          gender: "FEMALE",
          walletAddress: "0x00",
          birthDate: "1997-03-08T00:00:00.000Z",
          age: 28,
          location: "lalitpur",
          latitude: 26.24,
          longitude: 86.24,
          extras: {
            email: "test@mailinator.com",
            hasCitizenship: false,
            passportNumber: "1234567"
          },
          notes: "9785623749",
          bankedStatus: "BANKED",
          internetStatus: "HOME_INTERNET",
          phoneStatus: "FEATURE_PHONE",
          createdAt: "2024-09-09T10:38:19.380Z",
          updatedAt: "2024-09-10T11:52:23.576Z",
          deletedAt: null,
          isVerified: false
        }
      };
      
      const updateDto = {
        uuid: mockResponse.data.uuid,
        data: dto
      };

      mockAxiosInstance.put.mockResolvedValue(mockResponse);
      const result = await client.update(updateDto);
      expect(mockAxiosInstance.put).toHaveBeenCalledWith(`/beneficiaries/${updateDto.uuid}`, updateDto.data, undefined);
      expect(result.httpReponse).toEqual(mockResponse);
    });
  });

  describe('getByPhone', () => {
    it('should return details of specific beneficiary as per phone number', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 2,
          uuid: randomUUID(),
          gender: "FEMALE",
          walletAddress: "0x00",
          birthDate: "1997-03-08T00:00:00.000Z",
          age: 20,
          location: "xyz",
          latitude: 26.24,
          longitude: 86.24,
          extras: {
            email: "test@mailinator.com",
            hasCitizenship: true,
            passportNumber: "1234567"
          },
          notes: "9785623749",
          bankedStatus: "BANKED",
          internetStatus: "HOME_INTERNET",
          phoneStatus: "FEATURE_PHONE",
          createdAt: "2024-09-09T10:38:19.380Z",
          updatedAt: "2024-09-09T10:38:19.380Z",
          deletedAt: null,
          isVerified: false,
          BeneficiaryProject: [],
          piiData: {
            beneficiaryId: 2,
            name: "ABC",
            phone: "9898",
            email: null,
            extras: {
              bank: "Bank",
              account: "9872200001"
            }
          }
        }
      };
      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);
      const result = await client.getByPhone(mockResponse.data.piiData.phone);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/beneficiaries/phone/${mockResponse.data.piiData.phone}`, undefined );
      expect(result.httpReponse).toEqual(mockResponse);
    });
  });

  describe('importTempBeneficiaries', () => {
    it('should import beneficiaries from temp', async () => {
      const mockRequest = {
        groupUUID: randomUUID()
      };
      const mockResponse = {
        success: true,
        data: {
          message: "Beneficiaries added to the queue!"
        }
      };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);
      const result = await client.importTempBeneficiaries(mockRequest);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/beneficiaries/import-temp', mockRequest, undefined);
      expect(result.httpReponse).toEqual(mockResponse);
    });
  });
});