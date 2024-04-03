import { Injectable } from '@nestjs/common';
import { PrismaService } from '@rumsan/prisma';
import { StatDto } from './dto/stat.dto';

@Injectable()
export class StatsService {
  constructor(private prismaService: PrismaService) {}
  async save(data: StatDto) {
    console.log(data);

    data.name = data.name.toUpperCase();
    // let whereFilter = { name: data.name, group: 'beneficiary' };
    if (data.group !== 'beneficiary') {
      // whereFilter.group = data.group || '';
      data.name = data.name + data.group;
    }
    // console.log(whereFilter);
    // const stats = await this.prismaService.stats.findMany({
    //   where: whereFilter,
    // });
    // console.log(stats);

    // if (stats.length > 0) {
    //   //update the record
    //   return await this.prismaService.stats.updateMany({
    //     data,
    //     where: whereFilter,
    //   });
    // } else {
    //   //insert the record
    //   return await this.prismaService.stats.create({
    //     data,
    //   });
    // }

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
