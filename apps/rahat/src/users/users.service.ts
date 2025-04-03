import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateUserDto, ListUserDto } from '@rumsan/extensions/dtos';
import { PrismaService } from '@rumsan/prisma';
import { UsersService as RSUserService } from '@rumsan/user';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class UsersService extends RSUserService {

    //Not required to define it if there is no extra initialization
    constructor(
        protected readonly prisma: PrismaService,
        protected readonly eventEmitter: EventEmitter2,
        protected readonly walletService: WalletService,
    ) {
        super(prisma, eventEmitter);
    }

    // TODO: get current prefered chain from settings
    async create(userData: CreateUserDto) {
        console.log('Creating a new user with a random wallet address');
        const randomWallet = await this.walletService.createstellarWallets();
        console.log('Random wallet address:', randomWallet.address);
        userData.wallet = randomWallet.address;
        return super.create(userData).catch((error) => {
            console.error('Error creating user:', error);
            throw error;
        });
    }

    async getWallets(dto: ListUserDto) {
        console.log('Listing users');
        const userListData = await super.list(dto);
        const wallets = userListData.data.map((user) => {
            return { name: user.name, wallet: user.wallet };
        });
        return wallets;

    }


}
