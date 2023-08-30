import { Injectable, Logger } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { hexStringToBuffer } from 'src/utils/string-format';

@Injectable()
export class UsersService {
  private readonly _logger = new Logger('User Services');
  constructor(private prisma: PrismaService) {}

  async register(createUserDto: CreateUserDto) {
    this._logger.log(`Registering new user: ${createUserDto?.email}`);
    const walletAddress = hexStringToBuffer(createUserDto?.walletAddress);
    return this.prisma.user.create({
      data: {
        ...createUserDto,
        walletAddress,
      },
    });
  }

  async create(createUserDto: CreateUserDto) {
    this._logger.log(`Creating new user: ${createUserDto?.email}`);
    const walletAddress = hexStringToBuffer(createUserDto?.walletAddress);
    return this.prisma.user.create({
      data: {
        ...createUserDto,
        walletAddress,
      },
    });
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    this._logger.log(`Updating user: ${id}`);
    return `This action updates a #${id} user with payload ${updateUserDto}`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async findOneByEmail(email: string): Promise<any> {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }
}
