import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateUserDto, ListUserDto } from '@rumsan/extensions/dtos';
import { PrismaService } from '@rumsan/prisma';
import { UsersService as RSUserService } from '@rumsan/user';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class UsersService extends RSUserService {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly eventEmitter: EventEmitter2,
    protected readonly walletService: WalletService
  ) {
    super(prisma, eventEmitter);
  }

  // TODO: Multi-chain support - Currently uses instance's configured chain
  // Future: Allow chain selection per user
  async create(userData: CreateUserDto) {
    console.log('Creating a new user with a random wallet address');

    try {
      // Use wallet service's configured chain (single-chain per instance)
      // No need to specify chain - wallet service will use its detected chain type
      const randomWallet = await this.walletService.createWallet();

      console.log('Random wallet created:', {
        address: randomWallet.address,
        blockchain: randomWallet.blockchain || 'detected',
      });

      userData.wallet = randomWallet.address;

      return super.create(userData);
    } catch (error) {
      console.error('Error creating user wallet:', error);
      throw error;
    }
  }

  async getWallets(dto: ListUserDto) {
    console.log('Listing users');
    const userListData = await super.list(dto);
    const wallets = userListData.data.map((user) => {
      return {
        name: user.name,
        wallet: user.wallet,
        // TODO: Multi-chain support - Add chain type detection
        // chainType: this.detectChainFromWallet(user.wallet)
      };
    });
    return wallets;
  }

  // TODO: Multi-chain support - Helper method for future use
  // private detectChainFromWallet(walletAddress: string): string {
  //   if (walletAddress?.startsWith('0x') && walletAddress.length === 42) {
  //     return 'evm';
  //   }
  //   if (walletAddress?.length === 56 && walletAddress.startsWith('G')) {
  //     return 'stellar';
  //   }
  //   return 'unknown';
  // }
}
