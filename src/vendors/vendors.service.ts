import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { paginate } from '@utils/paginate';
import { bufferToHexString, hexStringToBuffer } from '@utils/string-format';
import {
  createContractInstance,
  createContractInstanceSign,
  isAddress,
  multiSend,
  verifyMessage,
} from '@utils/web3';
import { PrismaService } from 'src/prisma/prisma.service';
import { BlockchainVendorDTO } from './dto/blockchain-vendor.dto';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { ListVendorDto } from './dto/list-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';

enum Status {
  NEW,
  OFFLINE,
  ONLINE,
  SUCCESS,
  FAIL,
}

type IOfflineTransactionItem = {
  createdAt: string;
  amount: string;
  status: Status;
  isOffline: boolean;
  hash?: string;
  walletAddress?: string;
  phone?: string;
};

type IParams = string[];

@Injectable()
export class VendorsService {
  constructor(private prisma: PrismaService) {}

  async create(createVendorDto: CreateVendorDto) {
    const vendor = await this.prisma.vendor.create({
      data: {
        ...createVendorDto,
        walletAddress: hexStringToBuffer(createVendorDto.walletAddress),
        address: JSON.stringify(createVendorDto.address),
      },
    });
    return {
      ...vendor,
      walletAddress: bufferToHexString(vendor.walletAddress),
    };
  }

  findAll(query: ListVendorDto) {
    const { page, perPage, ...rest } = query;

    const where: Prisma.VendorWhereInput = { deletedAt: null };
    if (rest.name) {
      where.name = {
        contains: rest.name,
        mode: 'insensitive',
      };
    }

    if (rest.phone) {
      where.phone = {
        contains: rest.phone,
        mode: 'insensitive',
      };
    }

    if (rest.walletAddress) {
      where.walletAddress = hexStringToBuffer(rest.walletAddress);
    }
    const select: Prisma.VendorSelect = {
      name: true,
      walletAddress: true,
      isApproved: true,
      isActive: true,
      _count: {
        select: {
          projects: true,
        },
      },
      // projects: {
      //   select: {
      //     name: true,
      //     id: true,
      //   },
      // },
    };

    return paginate(
      this.prisma.vendor,
      { where, select },
      {
        page,
        perPage,
        transformRows: (rows) =>
          rows.map((r) => ({
            ...r,
            walletAddress: bufferToHexString(r.walletAddress),
          })),
      },
    );
  }

  async findOne(walletAddress: string) {
    const data = await this.prisma.vendor.findUniqueOrThrow({
      where: {
        walletAddress: hexStringToBuffer(walletAddress),
      },
      select: {
        address: true,
        name: true,
        phone: true,
        walletAddress: true,
        isApproved: true,
        isActive: true,
        createdAt: true,
        deletedAt: true,
        updatedAt: true,
        email: true,
        id: true,
        projects: {
          select: {
            name: true,
            id: true,
            isApproved: true,
            owner: {
              select: {
                name: true,
                id: true,
              },
            },
            projectType: true,
          },
        },
        _count: true,
      },
    });

    return {
      ...data,
      walletAddress: bufferToHexString(data.walletAddress),
    };
  }

  update(walletAddress: string, updateVendorDto: UpdateVendorDto) {
    return this.prisma.vendor.update({
      where: {
        walletAddress: hexStringToBuffer(walletAddress),
      },
      data: {
        ...updateVendorDto,
        walletAddress: hexStringToBuffer(updateVendorDto.walletAddress),
      },
    });
  }

  remove(walletAddress: string) {
    return this.prisma.vendor.update({
      where: {
        walletAddress: hexStringToBuffer(walletAddress),
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  approval(walletAddress: string) {
    return this.prisma.vendor.update({
      where: {
        walletAddress: hexStringToBuffer(walletAddress),
      },
      data: {
        isApproved: true,
      },
    });
  }

  async changeVendorState(walletAddress: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: {
        walletAddress: hexStringToBuffer(walletAddress),
      },
    });
    const updateVendor = await this.prisma.vendor.update({
      where: {
        walletAddress: hexStringToBuffer(walletAddress),
      },
      data: {
        isActive: !vendor.isActive,
      },
      select: {
        isActive: true,
      },
    });

    return updateVendor.isActive;
  }

  async getContractByName(contractName: string) {
    const addresses = await this.prisma.appSettings.findMany({
      where: {
        name: 'CONTRACT_ADDRESS',
      },
    });

    const address = addresses[0].value[contractName];
    if (!address) {
      throw new Error(`Contract ${contractName} not found.`);
    }

    return address;
  }

  async getProjectBalance(params: IParams) {
    const [projectId] = params;
    const contractFn = await createContractInstance(
      await this.getContractByName('RahatToken'),
      this.prisma.appSettings,
    );
    const CVAProject = await this.getContractByName(projectId);
    return (await contractFn?.balanceOf(CVAProject.address))?.toString();
  }

  async checkIsVendorApproved(params: IParams) {
    const [vendorAddress] = params;
    const contractFn = await createContractInstance(
      await this.getContractByName('RahatCommunity'),
      this.prisma.appSettings,
    );
    const vendorRole = await contractFn?.VENDOR_ROLE();
    return contractFn?.hasRole(vendorRole, vendorAddress);
  }

  async checkIsProjectLocked(params: IParams) {
    let [projectId] = params;
    if (!projectId) projectId = 'CVAProject';
    const contractFn = await createContractInstance(
      await this.getContractByName(projectId),
      this.prisma.appSettings,
    );
    return contractFn?.isLocked();
  }

  async getPendingTokensToAccept(params: IParams) {
    const [vendorAddress] = params;
    const contractFn = await createContractInstance(
      await this.getContractByName('CVAProject'),
      this.prisma.appSettings,
    );
    return (await contractFn?.vendorAllowancePending(vendorAddress)).toString();
  }

  async getDisbursed(params: IParams) {
    const [walletAddress] = params;
    const contractFn = await createContractInstance(
      await this.getContractByName('RahatToken'),
      this.prisma.appSettings,
    );
    return (await contractFn?.balanceOf(walletAddress)).toString();
  }

  async getVendorAllowance(params: IParams) {
    const [vendorAddress] = params;
    const contractFn = await createContractInstance(
      await this.getContractByName('CVAProject'),
      this.prisma.appSettings,
    );
    return (await contractFn?.vendorAllowance(vendorAddress))?.toString();
  }

  async acceptPendingTokens(params: IParams) {
    const walletAddress = params[0];
    let numberOfTokens = params[1];
    if (!numberOfTokens)
      numberOfTokens = await this.getPendingTokensToAccept([walletAddress]);
    const contractFn = await createContractInstanceSign(
      await this.getContractByName('CVAProject'),
      this.prisma.appSettings,
    );
    return contractFn?.acceptAllowanceByVendor(numberOfTokens);
  }

  async getBeneficiaryBalance(params: IParams) {
    const [beneficiaryAddress] = params;
    const contractFn = await createContractInstance(
      await this.getContractByName('CVAProject'),
      this.prisma.appSettings,
    );
    let balance = await contractFn
      ?.beneficiaryClaims(beneficiaryAddress)
      .catch(
        (error: { error: { error: { error: { toString: () => any } } } }) => {
          try {
            let message = error.error.error.error.toString();
            message = message.replace(
              'Error: VM Exception while processing transaction: revert ',
              '',
            );
          } catch (e) {
            console.error(error);
          }
        },
      );
    balance = balance?.toString();
    return balance;
  }

  async chargeBeneficiary(params: any) {
    const [message, signedMessage] = params;
    const walletAddress = verifyMessage(JSON.stringify(message), signedMessage);
    const CVAProject = await createContractInstanceSign(
      await this.getContractByName('CVAProject'),
      this.prisma.appSettings,
    );
    return CVAProject.sendBeneficiaryTokenToVendor(
      message?.walletAddress,
      walletAddress,
      message?.amount,
    );
  }

  //#region online Transactions Pathwork - need to change

  async assertBeneficiary(beneficiaryId: string): Promise<string> {
    if (isAddress(beneficiaryId)) return beneficiaryId;
    const beneficiary = await this.prisma.beneficiary.findUnique({
      where: {
        phone: beneficiaryId,
      },
    });
    if (!beneficiary) throw new Error('Invalid Beneficiary Address');
    return bufferToHexString(beneficiary?.walletAddress);
  }

  async initiateTransactionForVendor(params: IParams) {
    console.log({ params });
    const [vendorAddress, beneficiaryId, amount] = params;
    const beneficiaryAddress = await this.assertBeneficiary(beneficiaryId);

    console.log(vendorAddress, beneficiaryAddress, amount);
    const CVAProject = await createContractInstanceSign(
      await this.getContractByName('CVAProject'),
      this.prisma.appSettings,
    );
    return CVAProject?.initiateTokenRequestForVendor(
      vendorAddress,
      beneficiaryAddress,
      amount,
    );
  }

  async processTransactionForVendor(params: IParams) {
    const [vendorAddress, beneficiaryId, otp] = params;
    console.log({ vendorAddress, beneficiaryId, otp });
    const beneficiaryAddress = await this.assertBeneficiary(beneficiaryId);
    console.log({ vendorAddress, beneficiaryAddress, otp });
    const CVAProject = await createContractInstanceSign(
      await this.getContractByName('CVAProject'),
      this.prisma.appSettings,
    );
    return CVAProject?.processTokenRequestForVendor(
      vendorAddress,
      beneficiaryAddress,
      otp,
    );
  }

  //#endregion

  async getChainData(params: IParams) {
    const [walletAddress] = params;
    // const [allowance, balance, distributed, pendingTokens, isVendorApproved] =
    //   await Promise.all([
    //     this.getVendorAllowance([walletAddress]),
    //     this.getProjectBalance(['CVAProject']),
    //     this.getDisbursed([walletAddress]),
    //     this.getPendingTokensToAccept([walletAddress]),
    //     this.checkIsVendorApproved([walletAddress]),
    //   ]);
    // return { allowance, balance, distributed, pendingTokens, isVendorApproved };
    const requests = [
      this.getVendorAllowance([walletAddress]),
      this.getProjectBalance(['CVAProject']),
      this.getDisbursed([walletAddress]),
      this.getPendingTokensToAccept([walletAddress]),
      this.checkIsVendorApproved([walletAddress]),
    ];

    const results = [];

    for (const request of requests) {
      const result = await request;
      results.push(result);
      // await this.delay(100);
    }

    return results;
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  mapCallData(transactions: any, vendorAddress: string) {
    const res = transactions.map((el: IOfflineTransactionItem) => [
      el.walletAddress,
      vendorAddress,
      el.amount,
    ]);
    return res;
  }

  async syncTransactions(params: IParams) {
    const [message, signedMessage] = params;
    const walletAddress = verifyMessage(JSON.stringify(message), signedMessage);
    const callData = this.mapCallData(message, walletAddress);
    const CVAProject = await createContractInstanceSign(
      await this.getContractByName('CVAProject'),
      this.prisma.appSettings,
    );
    return multiSend(CVAProject, 'sendBeneficiaryTokenToVendor', callData);
  }

  async blockchainCall(payload: BlockchainVendorDTO) {
    const { method, params } = payload;
    switch (method) {
      case 'getChainData':
        return this.getChainData(params);
      case 'getProjectBalance':
        return this.getProjectBalance(params);
      case 'getPendingTokensToAccept':
        return this.getPendingTokensToAccept(params);
      case 'getDisbursed':
        return this.getDisbursed(params);
      case 'getVendorAllowance':
        return this.getVendorAllowance(params);
      case 'checkIsVendorApproved':
        return this.checkIsVendorApproved(params);
      case 'checkIsProjectLocked':
        return this.checkIsProjectLocked(params);
      case 'getBeneficiaryBalance':
        return this.getBeneficiaryBalance(params);
      case 'acceptPendingTokens':
        return this.acceptPendingTokens(params);
      case 'syncTransactions':
        return this.syncTransactions(params);
      case 'chargeBeneficiary':
        return this.chargeBeneficiary(params);
      case 'initiateTransactionForVendor':
        return this.initiateTransactionForVendor(params);
      case 'processTransactionForVendor':
        return this.processTransactionForVendor(params);
      default:
        throw new Error(`${method} method doesn't exist`);
    }
  }
}
