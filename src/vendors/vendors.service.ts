import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { paginate } from '@utils/paginate';
import { bufferToHexString, hexStringToBuffer } from '@utils/string-format';
import { Contract, JsonRpcProvider, ethers } from 'ethers';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import {
  ListVendorDto,
  ProcessTokenRequest,
  RequestTokenFromBeneficiaryDto,
} from './dto/list-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';

type RegisterProps = {
  name: string;
  phone: string;
};

@Injectable()
export class VendorsService {
  constructor(private prisma: PrismaService) {}

  async create(createVendorDto: CreateVendorDto) {
    console.log('CREATE VENDOR', createVendorDto);
    const vendor = await this.prisma.vendor.create({
      data: {
        ...createVendorDto,
        walletAddress: hexStringToBuffer(createVendorDto.walletAddress),
        address: JSON.stringify(createVendorDto.address),
      },
    });
    console.log(vendor);
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

  async createContractInstance(projectName: string) {
    //  Get Contract
    const contract = await this.getContractByName(projectName);

    //  Create Provider
    const provider = new JsonRpcProvider('http://localhost:8545');

    //  Create an instance of the contract
    return new Contract(contract.address, contract.abi, provider);
  }

  async createContractInstanceSign(projectName: string) {
    //  Get Contract
    const contract = await this.getContractByName(projectName);

    //  Create wallet from private key
    const provider = new JsonRpcProvider('http://localhost:8545');
    const privateKey = process.env.RAHAT_ADMIN_PRIVATE_KEY;
    console.log('PRIVATE KEY', privateKey);
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log('created Wallet', wallet);

    //  Create an instance of the contract
    return new Contract(contract.address, contract.abi, wallet);
  }

  register({ name, phone }: RegisterProps) {
    return console.log('INSIDE REGISTER VENDOR FUNCTION', name, phone);
  }

  async getProjectBalance(projectId = 'CVAProject') {
    const contractFn = await this.createContractInstance('RahatToken');
    const CVAProject = await this.getContractByName(projectId);
    return (await contractFn?.balanceOf(CVAProject.address))?.toString();
  }

  async checkIsVendorApproved(vendorAddress: string) {
    const contractFn = await this.createContractInstance('RahatCommunity');
    const vendorRole = await contractFn?.VENDOR_ROLE();
    return contractFn?.hasRole(vendorRole, vendorAddress);
  }

  async checkIsProjectLocked(projectId = 'CVAProject') {
    const contractFn = await this.createContractInstance(projectId);
    return contractFn?.isLocked();
  }

  async getPendingTokensToAccept(vendorAddress: string) {
    const contractFn = await this.createContractInstance('CVAProject');
    return (await contractFn?.vendorAllowancePending(vendorAddress)).toString();
  }

  async getDisbursed(walletAddress: string) {
    const contractFn = await this.createContractInstance('RahatToken');
    return (await contractFn?.balanceOf(walletAddress)).toString();
  }

  async getVendorAllowance(vendorAddress: string) {
    const contractFn = await this.createContractInstance('CVAProject');
    return (await contractFn?.vendorAllowance(vendorAddress))?.toString();
  }

  async acceptTokensByVendor(walletAddress: string, numberOfTokens: string) {
    if (!numberOfTokens)
      numberOfTokens = await this.getPendingTokensToAccept(walletAddress);
    console.log('INSIDE ACCEPT PENDING TOKENS');
    const contractFn = await this.createContractInstanceSign('CVAProject');
    console.log('NUMBER OF TOKEN', numberOfTokens.toString());
    return contractFn?.acceptAllowanceByVendor(numberOfTokens.toString());
  }

  async getBeneficiaryBalance(beneficiaryAddress: string) {
    const contractFn = await this.createContractInstance('CVAProject');
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
            console.log(message);
          } catch (e) {
            console.log(
              'Error occured calling contract. Please check logs for details.',
            );
            console.error(error);
          }
        },
      );
    balance = balance?.toString();
    return balance;
  }

  async requestTokenFromBeneficiary(query: RequestTokenFromBeneficiaryDto) {
    const { to, amount } = query;
    const contractFn = await this.createContractInstance('CVAProject');
    const RahatClaimContractFn = await this.createContractInstance(
      'RahatClaim',
    );
    const transaction = await contractFn[
      'requestTokenFromBeneficiary(address,uint256)'
    ](
      to,
      amount?.toString(),
      // TODO: change this to the actual address
      // '0xc0ECad507A3adC91076Df1D482e3D2423F9a9EF9'
    );
    const receipt = await transaction.wait();
    const event = receipt.logs[0];
    const decodedEventArgs = RahatClaimContractFn?.interface.decodeEventLog(
      'ClaimCreated',
      event.data,
      event.topics,
    );
    console.log({ decodedEventArgs });
    return decodedEventArgs?.claimId?.toString();
  }

  async processTokenRequest(query: ProcessTokenRequest) {
    const { beneficiary, otp } = query;
    const contractFn = await this.createContractInstance('CVAProject');
    contractFn?.processTokenRequest(beneficiary, otp).catch((error: any) => {
      try {
        let message = error.error.error.error.toString();
        message = message.replace(
          'Error: VM Exception while processing transaction: revert ',
          '',
        );
        console.log({ message });
        throw message;
      } catch (e) {
        console.error(error);
        throw error;
      }
    });
  }

  async chargeBeneficiary(walletAddress: string, payload: any) {
    console.log(`Charge beneficiary-${walletAddress}`);
    const { phone, amount } = payload;
    console.log('PAYLOAD', payload);
    const beneficiary = await this.prisma.beneficiary.findFirstOrThrow({
      where: {
        phone,
      },
      include: {
        _count: {
          select: {
            projects: true,
          },
        },
        projects: {
          select: {
            name: true,
            projectType: true,
            contractAddress: true,
          },
        },
      },
    });
    beneficiary.address = bufferToHexString(beneficiary.walletAddress);
    // const beneficiary = await this.findAll({
    //   phone,
    //   order: 'asc',
    //   orderBy: 'name',
    // });
    const beneficiaryBalance = await this.getBeneficiaryBalance(
      beneficiary.address,
    );
    if (!beneficiaryBalance) throw "Beneficiary Doesn't have enough balance";
    console.log({ beneficiary }, { beneficiaryBalance });
  }

  async verifyOtp(walletAddress: string) {
    return console.log('VERIFY OTP', walletAddress);
  }

  async getVendorWalletNonce(walletAddress: string) {
    return console.log(
      'INSIDE GET VENDOR WALLET NONCE FUNCTION',
      walletAddress,
    );
  }

  async getChainData(walletAddress: string) {
    const [allowance, balance, distributed, pendingTokens, isVendorApproved] =
      await Promise.all([
        this.getVendorAllowance(walletAddress),
        this.getProjectBalance(),
        this.getDisbursed(walletAddress),
        this.getPendingTokensToAccept(walletAddress),
        this.checkIsVendorApproved(walletAddress),
      ]);
    return { allowance, balance, distributed, pendingTokens, isVendorApproved };
  }

  async syncTransactions(transactions: any) {
    console.log('SIGNED MESSAGE', transactions);
  }
}
