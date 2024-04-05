import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { CreateProjectDto, UpdateProjectDto } from '@rahataid/extensions';
import {
  AAJobs,
  BeneficiaryJobs,
  MS_ACTIONS,
  MS_TIMEOUT,
  ProjectEvents,
  ProjectJobs,
  VendorJobs,
} from '@rahataid/sdk';
import { PrismaService } from '@rumsan/prisma';
import { SettingsService } from '@rumsan/settings';
import { UUID } from 'crypto';
import { catchError, throwError, timeout } from 'rxjs';

@Injectable()
export class ProjectService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    @Inject('RAHAT_CLIENT') private readonly client: ClientProxy
  ) { }

  async create(data: CreateProjectDto) {

    // TODO: refactor to proper validator
    switch (data.type) {
      case 'AA':
        SettingsService.get('AA')
        break;
      case 'CVA':
        SettingsService.get('CVA')
        break;
      case 'EL':
        SettingsService.get('EL')
        break;
      default:
        throw new Error('Invalid project type.')
    }

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
          .send({ cmd: ProjectJobs.PROJECT_SETTINGS_LIST, uuid }, {})
          .pipe(timeout(MS_TIMEOUT));
      case MS_ACTIONS.SETTINGS.GET:
        return this.client
          .send({ cmd: ProjectJobs.PROJECT_SETTINGS_GET, uuid }, payload)
          .pipe(timeout(MS_TIMEOUT));
      case MS_ACTIONS.BENEFICIARY.ADD_TO_PROJECT:
        return this.client
          .send(
            { cmd: BeneficiaryJobs.ADD_TO_PROJECT },
            { dto: payload, projectUid: uuid }
          )
          .pipe(timeout(MS_TIMEOUT));
      case MS_ACTIONS.ELPROJECT.REDEEM_VOUCHER:
        return this.client
          .send({ cmd: ProjectJobs.REDEEM_VOUCHER, uuid }, payload)
          .pipe(timeout(MS_TIMEOUT));
      case MS_ACTIONS.ELPROJECT.PROCESS_OTP:
        return this.client
          .send({ cmd: ProjectJobs.PROCESS_OTP, uuid }, payload)
          .pipe(timeout(MS_TIMEOUT));
      case MS_ACTIONS.ELPROJECT.ASSIGN_DISCOUNT_VOUCHER:
        return this.client
          .send({ cmd: ProjectJobs.ASSIGN_DISCOUNT_VOUCHER, uuid }, payload)
          .pipe(timeout(MS_TIMEOUT));
      case MS_ACTIONS.BENEFICIARY.ASSGIN_TO_PROJECT:
        return this.client.send(
          { cmd: BeneficiaryJobs.ASSIGN_TO_PROJECT },
          { projectId: uuid, ...payload }
        );
      case MS_ACTIONS.BENEFICIARY.BULK_ASSIGN_TO_PROJECT:
        return this.client.send(
          { cmd: BeneficiaryJobs.BULK_ASSIGN_TO_PROJECT },
          { projectId: uuid, ...payload }
        );
      case MS_ACTIONS.BENEFICIARY.LIST_BY_PROJECT:
        return this.client.send(
          { cmd: BeneficiaryJobs.LIST_BY_PROJECT },
          { projectId: uuid, ...payload }
        );

      /***********************
      * Development Only
      *************************/
      case MS_ACTIONS.AAPROJECT.SCHEDULE.DEV_ONLY:
        return this.client.send({ cmd: AAJobs.SCHEDULE.DEV_ONLY, uuid }, payload);
      /************************/

      case MS_ACTIONS.AAPROJECT.SCHEDULE.ADD:
        return this.client.send({ cmd: AAJobs.SCHEDULE.ADD, uuid }, payload);

      case MS_ACTIONS.AAPROJECT.SCHEDULE.REMOVE:
        return this.client.send({ cmd: AAJobs.SCHEDULE.REMOVE, uuid }, payload);

      case MS_ACTIONS.AAPROJECT.SCHEDULE.GET_ALL:
        return this.client.send({ cmd: AAJobs.SCHEDULE.GET_ALL, uuid }, {});

      case MS_ACTIONS.VENDOR.ASSIGN_TO_PROJECT:
        return this.client
          .send(
            { cmd: VendorJobs.ASSIGN_PROJECT },
            { projectId: uuid, ...payload }
          )
          .pipe(
            catchError((error) =>
              throwError(() => new RpcException(error.response))
            )
          )
          .pipe(timeout(MS_TIMEOUT));

      case MS_ACTIONS.VENDOR.LIST_BY_PROJECT:
        return this.client
          .send(
            { cmd: VendorJobs.LIST_BY_PROJECT },
            { projectId: uuid, ...payload })
      case MS_ACTIONS.ELPROJECT.REQUEST_REDEMPTION:
        return this.client
          .send(
            { cmd: ProjectJobs.REQUEST_REDEMPTION, uuid },
            payload
          ).pipe(timeout(500000))
      case MS_ACTIONS.ELPROJECT.UPDATE_REDEMPTION:
        return this.client
          .send(
            { cmd: ProjectJobs.UPDATE_REDEMPTION, uuid },
            payload
          ).pipe(timeout(500000))
      case MS_ACTIONS.ELPROJECT.LIST_REDEMPTION:
        return this.client
          .send(
            { cmd: ProjectJobs.LIST_REDEMPTION, uuid },
            payload
          ).pipe(timeout(500000))
      case MS_ACTIONS.ELPROJECT.GET_VENDOR_REDEMPTION:
        return this.client
          .send(
            { cmd: ProjectJobs.GET_VENDOR_REDEMPTION, uuid },
            payload
          ).pipe(timeout(500000))
      case MS_ACTIONS.ELPROJECT.GET_VENDOR_REFERRER:
        return this.client
          .send(
            { cmd: BeneficiaryJobs.VENDOR_REFERRAL, uuid },
            payload
          ).pipe(timeout(50000))
      default:
        throw new Error('Please provide a valid action!');
    }
  }
}
