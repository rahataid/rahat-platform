import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClientProxy } from '@nestjs/microservices';
import { CreateProjectDto, UpdateProjectDto } from '@rahataid/extensions';
import { BeneficiaryJobs, MS_ACTIONS, ProjectEvents, ProjectJobs } from '@rahataid/sdk';
import { PrismaService } from '@rumsan/prisma';
import { UUID } from 'crypto';
import { timeout } from 'rxjs';
@Injectable()
export class ProjectService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    @Inject('RAHAT_CLIENT') private readonly client: ClientProxy
  ) {}

  async create(data: CreateProjectDto) {
    const project = await this.prisma.project.create({
      data,
    });

    this.eventEmitter.emit(ProjectEvents.PROJECT_CREATED, project);

    return project;
  }

  async list() {
    return this.prisma.project.findMany();
  }

  async findOne(uuid: UUID) {
    console.log('uuid', uuid);
    return this.prisma.project.findUnique({
      where: {
        uuid,
      },
    });
  }

  async update(uuid: UUID, data: UpdateProjectDto) {
    return this.prisma.project.update({
      where: {
        uuid,
      },
      data,
    });
  }

  async remove(uuid: UUID) {
    return this.prisma.project.delete({
      where: {
        uuid,
      },
    });
  }

  async handleProjectActions({ uuid, action, payload }) {
    switch (action) {
      case MS_ACTIONS.SETTINGS.LIST:
        return this.client
          .send({cmd:ProjectJobs.PROJECT_SETTINGS_LIST,uuid},{}
          ).pipe(timeout(5000));
      case MS_ACTIONS.SETTINGS.GET:
        return this.client
          .send(
            {cmd:ProjectJobs.PROJECT_SETTINGS_GET,uuid},
            payload
            ).pipe(timeout(5000));
      case MS_ACTIONS.BENEFICIARY.ADD_TO_PROJECT:
        return this.client
          .send(
            { cmd: BeneficiaryJobs.ADD_TO_PROJECT },
            { dto: payload, projectUid: uuid }
          )
          .pipe(timeout(500000));
      case MS_ACTIONS.ELPROJECT.REDEEM_VOUCHER:
        return this.client
            .send(
              {cmd: ProjectJobs.REDEEM_VOUCHER, uuid},
              payload
            ).pipe(timeout(500000));
      case MS_ACTIONS.ELPROJECT.PROCESS_OTP:
        return this.client
        .send(
          {cmd:ProjectJobs.PROCESS_OTP,uuid},
          payload
          ).pipe(timeout(500000));
      case MS_ACTIONS.ELPROJECT.ASSIGN_DISCOUNT_VOUCHER:
        return this.client
        .send(
          {cmd:ProjectJobs.ASSIGN_DISCOUNT_VOUCHER,uuid},
          payload
          ).pipe(timeout(500000));
      case MS_ACTIONS.BENEFICIARY.ASSGIN_TO_PROJECT:
        return this.client
        .send(
          {cmd:BeneficiaryJobs.ASSIGN_TO_PROJECT},
          {projectId:uuid,...payload})
      case MS_ACTIONS.BENEFICIARY.BULK_ASSIGN_TO_PROJECT:
        return this.client
          .send({cmd:BeneficiaryJobs.BULK_ASSIGN_TO_PROJECT},
            {projectId:uuid,...payload})
      default:
        throw new Error('Please provide a valid action!');
    }
  }
}
