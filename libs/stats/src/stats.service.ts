import { Injectable } from '@nestjs/common';
import { PrismaService } from '@rumsan/prisma';
import { StatDto } from './dto/stat.dto';

@Injectable()
export class StatsService {
  constructor(private prismaService: PrismaService) {}
  save(data: StatDto) {
    // this.prismaService.stats.findMany({
    //   where: { name: data.name },
    // });
    // let whereClause;
    // if (data.projectUuid) {
    //   whereClause = {
    //     name: data.name,
    //     projectUuid: data.projectUuid,
    //   };
    // } else {
    //   whereClause = {
    //     name: data.name,
    //   };
    // }
    // data.name = data.name.toUpperCase();
    // return this.prismaService.stats.upsert({
    //   where: whereClause,
    //   update: data,
    //   create: data,
    // });
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
      where: { id: 1 },
    });
  }

  remove(name: string) {
    return this.prismaService.stats.delete({
      where: { id: 1 },
    });
  }
}
