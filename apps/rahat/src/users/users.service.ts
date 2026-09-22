import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClientProxy } from '@nestjs/microservices';
import { CreateUserDto, ListUserDto } from '@rumsan/extensions/dtos';
import { PrismaService } from '@rumsan/prisma';
import { UsersService as RSUserService } from '@rumsan/user';
import { AUTH_SERVICE_CLIENT } from '@rumsan/user/ability/ms-rpc-auth';
import { NotificationService } from '../notification/notification.service';
import { DatabaseWalletStorage } from '../wallet/storages/database.storage';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class UsersService extends RSUserService {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly eventEmitter: EventEmitter2,
    @Inject(AUTH_SERVICE_CLIENT) authClient: ClientProxy,
    protected readonly walletService: WalletService,
    protected readonly notificationService: NotificationService
  ) {
    super(prisma, eventEmitter, authClient);
  }

  async create(userData: CreateUserDto) {
    try {
      // Create wallets for all active chains from a shared mnemonic
      const [multiChainResult] = await this.walletService.createBulkForAllChains(1);

      userData.wallet = multiChainResult.defaultAddress;

      const res = await super.create(userData, async (err, tx, user) => {
        if (err || !user) return;
        // Assign the entity ID to pre-generated wallets using database storage helper
        await DatabaseWalletStorage.assignEntity(
          tx,
          multiChainResult.wallets,
          user.uuid,
          multiChainResult.defaultAddress
        );
      });

      await this.notificationService.createNotification({
        title: 'User has been added',
        description: `A new user has been added Name: ${userData.name}`,
        group: 'User Management',
      });

      return res;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getWallets(dto: ListUserDto) {
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
