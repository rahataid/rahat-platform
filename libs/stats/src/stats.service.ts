import { Injectable } from '@nestjs/common';
import { PrismaService } from '@rumsan/prisma';
import { StatDto } from './dto/stat.dto';

@Injectable()
export class StatsService {
  constructor(private prismaService: PrismaService) { }
  async save(data: StatDto) {
    data.name = data.name.toUpperCase();
    if (data.group !== 'beneficiary') {
      data.name = data.name + data.group;
    }

    return this.prismaService.stats.upsert({
      where: { name: data.name },
      update: data,
      create: data,
    });
  }

  getByGroup(
    group: string,
    select: { name?: boolean; data?: boolean; group?: boolean } | null = null
  ) {
    return this.prismaService.stats.findMany({
      where: { group },
      select,
    });
  }

  findAll() {
    return this.prismaService.stats.findMany();
  }

  findOne(name: string) {
    return this.prismaService.stats.findUnique({
      where: { name },
    });
  }

  remove(name: string) {
    return this.prismaService.stats.delete({
      where: { name },
    });
  }
}
