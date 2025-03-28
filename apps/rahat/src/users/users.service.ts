import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateUserDto, ListRoleDto } from '@rumsan/extensions/dtos';
import { PrismaService } from '@rumsan/prisma';
import { UsersService as RSUserService } from '@rumsan/user';
import { ethers } from 'ethers';

@Injectable()
export class UsersService extends RSUserService {
    constructor(
        protected readonly prisma: PrismaService,
        protected readonly eventEmitter: EventEmitter2,
    ) {
        super(prisma, eventEmitter);
    }

    async create(userData: CreateUserDto) {
        console.log('Creating a new user with a random wallet address');
        const randomWallet = ethers.Wallet.createRandom();
        console.log('Random wallet address:', randomWallet.address);
        userData.wallet = randomWallet.address;
        // console.log(this.walletService)
        //  userData.wallet = (await this.walletService.createethWallets()).address;
        return super.create(userData).catch((error) => {
            console.error('Error creating user:', error);
            throw error;
        });
    }

    // getById(userId: number) {
    //     console.log('Getting user by ID:', userId);
    //     // Custom implementation
    //     return super.getById(userId);
    // }

    async list(dto: ListRoleDto) {
        console.log('Listing users');
        const userListData = await super.list(dto);
        userListData.data = userListData.data.map((user) => {
            delete user.extras;
            return user;
        });
        return userListData;

    }


}
