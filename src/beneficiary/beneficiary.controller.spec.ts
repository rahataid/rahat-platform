// import { Test, TestingModule } from '@nestjs/testing';
// import { PrismaService } from 'src/prisma/prisma.service';
// import { BeneficiaryController } from './beneficiary.controller';
// import { BeneficiaryService } from './beneficiary.service';
// import { ListBeneficiaryDto } from './dto/list-beneficiary.dto';
// const result = {
//   meta: { total: 7, lastPage: 1, currentPage: 1, perPage: 25 },
//   rows: [
//     {
//       id: 1,
//       uuid: 'e6bed5a2-6bcd-41d9-88d7-2cf1b871ed5c',
//       name: 'Gillian Donaldson',
//       phone: '9843212908',
//       dob: '2021-01-07T18:15:00.000Z',
//       gender: 'MALE',
//       walletAddress: '0x41d72b295eb00d474db44ea9d3af8b7ffb63b8e6',
//       address: null,
//       longitude: 70,
//       latitude: 50,
//       isApproved: false,
//       isActive: true,
//       bankStatus: 'BANKED',
//       phoneOwnership: 'FEATURE',
//       internetAccess: 'PHONE_INTERNET',
//       extras: null,
//       createdAt: '2024-01-08T10:12:10.367Z',
//       updatedAt: '2024-01-10T06:21:10.452Z',
//       deletedAt: null,
//       projects: 'DRC Simulation Exercise',
//       _count: {
//         projects: 1,
//       },
//     },
//   ],
// };
// describe('BeneficiaryController', () => {
//   let controller: BeneficiaryController;
//   let service: BeneficiaryService;
//   let prisma: PrismaService;

//   describe('BeneficiaryController', () => {
//     let controller: BeneficiaryController;
//     let service: BeneficiaryService;

//     beforeEach(async () => {
//       const module: TestingModule = await Test.createTestingModule({
//         controllers: [BeneficiaryController],
//         providers: [BeneficiaryService, PrismaService],
//       }).compile();

//       controller = module.get<BeneficiaryController>(BeneficiaryController);
//       service = module.get<BeneficiaryService>(BeneficiaryService);
//     });

//     describe('findAll', () => {
//       it('should return an array of beneficiaries', async () => {
//         const query: ListBeneficiaryDto = {
//           page: '1',
//           perPage: '10',
//           orderBy: 'name',
//           order: 'asc',
//         };

//         const mockResult = {
//           rows: [],
//           meta: {
//             total: 0,
//             lastPage: 1,
//             currentPage: 1,
//             perPage: 10,
//           },
//         };
//         jest.spyOn(service, 'findAll').mockResolvedValue(mockResult);

//         const data = await controller.findAll(query);
//         expect(data).toEqual(mockResult);
//       });
//     });

//     describe('fineOne', () => {
//       it('should return a beneficiary', async () => {
//         const mockResult = {};
//         jest.spyOn(service, 'findOne').mockResolvedValue(mockResult);

//         const data = await controller.findOne('uuid');

//         expect(data).toEqual(mockResult);
//       });
//     });
//   });
//   afterAll(() => {
//     jest.resetAllMocks();
//   });
// });
