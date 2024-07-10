import { Injectable } from '@nestjs/common';
import { CreateTokenDto } from '@rahataid/extensions';
import { PrismaService } from '@rumsan/prisma';

@Injectable()
export class TokenService {

  constructor(private prisma: PrismaService) { }

  create(createTokenDto: CreateTokenDto) {
    return this.prisma.token.create({
      data: {
        ...createTokenDto
      }
    })
  }

  findAll() {
    return this.prisma.token.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  findOne(contractAddress: string) {
    return this.prisma.token.findUnique({
      where: {
        contractAddress
      }
    })
  }

  // update(id: number, updateTokenDto: UpdateTokenDto) {
  //   return `This action updates a #${id} token`;
  // }

  remove(id: number) {
    return `This action removes a #${id} token`;
  }
}
