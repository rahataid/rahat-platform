import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClientProxy } from '@nestjs/microservices';
import { CreateProjectDto, UpdateProjectDto } from '@rahataid/extensions';
import {
  AAJobs,
  BeneficiaryJobs,
  MS_ACTIONS,
  MS_TIMEOUT,
  ProjectEvents,
  ProjectJobs,
  VendorJobs
} from '@rahataid/sdk';
import { BeneficiaryType } from '@rahataid/sdk/enums';
import { PrismaService } from '@rumsan/prisma';
import { UUID } from 'crypto';
import { tap, timeout } from 'rxjs';
import { ERC2771FORWARDER } from '../utils/contracts';
import { createContractSigner } from '../utils/web3';
@Injectable()
export class ProjectService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    @Inject('RAHAT_CLIENT') private readonly client: ClientProxy
  ) { }

  async create(data: CreateProjectDto) {

    // TODO: refactor to proper validator
    // switch (data.type) {
    //   case 'AA':
    //     SettingsService.get('AA')
    //     break;
    //   case 'CVA':
    //     SettingsService.get('CVA')
    //     break;
    //   case 'EL':
    //     SettingsService.get('EL')
    //     break;
    //   default:
    //     throw new Error('Invalid project type.')
    // }

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

  async sendCommand(cmd, payload, timeoutValue = MS_TIMEOUT) {
    return this.client.send(cmd, payload).pipe(
      timeout(timeoutValue),
      tap((response) => {
        //send whatsapp message after added referal beneficiary to project
        if (
          response?.id &&
          cmd.cmd === BeneficiaryJobs.ADD_TO_PROJECT &&
          payload.dto.type === BeneficiaryType.REFERRED
        ) {
          this.eventEmitter.emit(
            ProjectEvents.BENEFICIARY_ADDED_TO_PROJECT,
            payload.dto
          );
        }
      })
    );
  }


  async executeMetaTxRequest(params: any) {
    const { metaTxRequest } = params;
    const forwarderContract = await createContractSigner(ERC2771FORWARDER, process.env.ERC2771_FORWARDER_ADDRESS);

    metaTxRequest.gas = BigInt(metaTxRequest.gas);
    metaTxRequest.nonce = BigInt(metaTxRequest.nonce);
    metaTxRequest.value = BigInt(metaTxRequest.value);
    const tx = await forwarderContract.execute(metaTxRequest);
    const res = await tx.wait();

    return { txHash: res.hash, status: res.status };
  }

  // async redeemVoucher (params:any,uuid:string){
  //   const {metaTxRequest} = params;
  //   const res = await this.executeMetaTxRequest({metaTxRequest});
  //   if(res.status === 1)   this.sendCommand({ cmd: ProjectJobs.REDEEM_VOUCHER, uuid }, params);
  //   return {txHash:res.txHash,status:res.status};

  // }

  // async requestRedemption (params:any,uuid:string){
  //   const {metaTxRequest} = params;
  //   const res = await this.executeMetaTxRequest({metaTxRequest});
  //   if(res.status === 1)  this.sendCommand(
  //     { cmd: ProjectJobs.REQUEST_REDEMPTION, uuid },
  //     params,
  //     500000
  //   );
  //   return {txHash:res.txHash,status:res.status};

  // }

  async handleProjectActions({ uuid, action, payload }) {
    const projectActions = {
      [MS_ACTIONS.SETTINGS.LIST]: () =>
        this.sendCommand({ cmd: ProjectJobs.PROJECT_SETTINGS_LIST, uuid }, {}),
      [MS_ACTIONS.SETTINGS.GET]: () =>
        this.sendCommand(
          { cmd: ProjectJobs.PROJECT_SETTINGS_GET, uuid },
          payload
        ),
      //     [MS_ACTIONS.ELPROJECT.REDEEM_VOUCHER]: () =>
      // this.sendCommand({ cmd: ProjectJobs.REDEEM_VOUCHER, uuid }, payload),
      // [MS_ACTIONS.ELPROJECT.PROCESS_OTP]: () =>
      //   this.sendCommand({ cmd: ProjectJobs.PROCESS_OTP, uuid }, payload),

      [MS_ACTIONS.ELPROJECT.REDEEM_VOUCHER]: async () =>
        await this.executeMetaTxRequest(payload),

      [MS_ACTIONS.ELPROJECT.PROCESS_OTP]: async () =>
        await this.executeMetaTxRequest(payload),


      [MS_ACTIONS.ELPROJECT.ASSIGN_DISCOUNT_VOUCHER]: async () =>
        await this.executeMetaTxRequest(payload),
      // this.sendCommand(
      //   { cmd: ProjectJobs.ASSIGN_DISCOUNT_VOUCHER, uuid },
      //   payload
      // ),
      [MS_ACTIONS.ELPROJECT.UPDATE_STATUS]: () =>
        this.sendCommand(
          { cmd: ProjectJobs.REDEEM_VOUCHER, uuid },
          payload),

      [MS_ACTIONS.ELPROJECT.REQUEST_REDEMPTION]: async () =>
        await this.executeMetaTxRequest(payload),

      [MS_ACTIONS.ELPROJECT.REQUEST_REDEMPTION_BE]: async () =>
        this.sendCommand(
          { cmd: ProjectJobs.REQUEST_REDEMPTION, uuid },
          payload,
          500000
        ),

      // this.sendCommand(
      //   { cmd: ProjectJobs.REQUEST_REDEMPTION, uuid },
      //   payload,
      //   500000
      // ),

      [MS_ACTIONS.ELPROJECT.UPDATE_REDEMPTION]: () =>
        this.sendCommand(
          { cmd: ProjectJobs.UPDATE_REDEMPTION, uuid },
          payload,
          500000
        ),
      [MS_ACTIONS.ELPROJECT.LIST_REDEMPTION]: () =>
        this.sendCommand(
          { cmd: ProjectJobs.LIST_REDEMPTION, uuid },
          payload,
          500000
        ),
      [MS_ACTIONS.ELPROJECT.GET_VENDOR_REDEMPTION]: () =>
        this.sendCommand(
          { cmd: ProjectJobs.GET_VENDOR_REDEMPTION, uuid },
          payload,
          500000
        ),

      [MS_ACTIONS.ELPROJECT.LIST_BEN_VENDOR_COUNT]: () =>
        this.sendCommand(
          { cmd: BeneficiaryJobs.LIST_BEN_VENDOR_COUNT },
          { projectId: uuid },
          500000
        ),
      /***********************
       * Development Only
      *************************/
      [MS_ACTIONS.AAPROJECT.SCHEDULE.DEV_ONLY]: () =>
        this.sendCommand({ cmd: AAJobs.SCHEDULE.DEV_ONLY, uuid }, payload),
      /************************/

      [MS_ACTIONS.AAPROJECT.SCHEDULE.ADD]: () =>
        this.sendCommand({ cmd: AAJobs.SCHEDULE.ADD, uuid }, payload),

      [MS_ACTIONS.AAPROJECT.SCHEDULE.REMOVE]: () =>
        this.sendCommand({ cmd: AAJobs.SCHEDULE.REMOVE, uuid }, payload),

      [MS_ACTIONS.AAPROJECT.SCHEDULE.GET_ALL]: () =>
        this.sendCommand({ cmd: AAJobs.SCHEDULE.GET_ALL, uuid }, {}),

      [MS_ACTIONS.AAPROJECT.RIVER_STATIONS.GET_DHM]: () =>
        this.sendCommand({ cmd: AAJobs.RIVER_STATIONS.GET_DHM, uuid }, {}),

      [MS_ACTIONS.AAPROJECT.WATER_LEVELS.GET_DHM]: () =>
        this.sendCommand({ cmd: AAJobs.WATER_LEVELS.GET_DHM, uuid }, {}),

      [MS_ACTIONS.AAPROJECT.ACTIVITIES.ADD]: () =>
        this.sendCommand({ cmd: AAJobs.ACTIVITIES.ADD, uuid }, payload),

      [MS_ACTIONS.AAPROJECT.ACTIVITIES.REMOVE]: () =>
        this.sendCommand({ cmd: AAJobs.ACTIVITIES.REMOVE, uuid }, payload),

      [MS_ACTIONS.AAPROJECT.ACTIVITIES.GET_ALL]: () =>
        this.sendCommand({ cmd: AAJobs.ACTIVITIES.GET_ALL, uuid }, payload),

      [MS_ACTIONS.AAPROJECT.ACTIVITY_CATEGORIES.GET_ALL]: () =>
        this.sendCommand({ cmd: AAJobs.ACTIVITY_CATEGORIES.GET_ALL, uuid }, payload),

      [MS_ACTIONS.AAPROJECT.ACTIVITY_CATEGORIES.ADD]: () =>
        this.sendCommand({ cmd: AAJobs.ACTIVITY_CATEGORIES.ADD, uuid }, payload),

      [MS_ACTIONS.AAPROJECT.ACTIVITY_CATEGORIES.REMOVE]: () =>
        this.sendCommand({ cmd: AAJobs.ACTIVITY_CATEGORIES.REMOVE, uuid }, payload),

      [MS_ACTIONS.AAPROJECT.HAZARD_TYPES.GET_ALL]: () =>
        this.sendCommand({ cmd: AAJobs.HAZARD_TYPES.GET_ALL, uuid }, {}),

      [MS_ACTIONS.AAPROJECT.PHASES.GET_ALL]: () =>
        this.sendCommand({ cmd: AAJobs.PHASES.GET_ALL, uuid }, {}),
    };

    const beneficiaryActions = {
      [MS_ACTIONS.BENEFICIARY.ADD_TO_PROJECT]: () =>
        this.sendCommand(
          { cmd: BeneficiaryJobs.ADD_TO_PROJECT },
          { dto: payload, projectUid: uuid }
        ),
      [MS_ACTIONS.BENEFICIARY.ASSGIN_TO_PROJECT]: () =>
        this.sendCommand(
          { cmd: BeneficiaryJobs.ASSIGN_TO_PROJECT },
          { projectId: uuid, ...payload }
        ),
      [MS_ACTIONS.BENEFICIARY.BULK_ASSIGN_TO_PROJECT]: () =>
        this.sendCommand(
          { cmd: BeneficiaryJobs.BULK_ASSIGN_TO_PROJECT },
          { projectId: uuid, ...payload }
        ),
      [MS_ACTIONS.BENEFICIARY.LIST_BY_PROJECT]: () =>
        this.sendCommand(
          { cmd: BeneficiaryJobs.LIST_BY_PROJECT },
          { projectId: uuid, ...payload }
        ),
      [MS_ACTIONS.BENEFICIARY.GET_PROJECT_SPECIFIC]: () =>
        this.sendCommand(
          { cmd: BeneficiaryJobs.GET_PROJECT_SPECIFIC },
          { projectId: uuid, ...payload }
        ),
      [MS_ACTIONS.ELPROJECT.GET_VENDOR_REFERRER]: () =>
        this.sendCommand(
          { cmd: BeneficiaryJobs.VENDOR_REFERRAL, uuid },
          payload,
          50000
        ),
    };

    const vendorActions = {
      [MS_ACTIONS.VENDOR.ASSIGN_TO_PROJECT]: () =>
        this.sendCommand(
          { cmd: VendorJobs.ASSIGN_PROJECT },
          { projectId: uuid, ...payload }
        ),
      [MS_ACTIONS.VENDOR.LIST_BY_PROJECT]: () =>
        this.sendCommand(
          { cmd: VendorJobs.LIST_BY_PROJECT },
          { projectId: uuid, ...payload }
        ),
    };

    const actions = {
      ...projectActions,
      ...beneficiaryActions,
      ...vendorActions,
    };

    const actionFunc = actions[action];
    if (!actionFunc) {
      throw new Error('Please provide a valid action!');
    }
    return await actionFunc();
  }
}
