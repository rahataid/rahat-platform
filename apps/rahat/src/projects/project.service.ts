import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClientProxy } from '@nestjs/microservices';
import { CreateProjectDto, UpdateProjectDto, UpdateProjectStatusDto } from '@rahataid/extensions';
import {
  BeneficiaryJobs,
  MS_ACTIONS,
  MS_TIMEOUT,
  ProjectEvents,
  ProjectJobs
} from '@rahataid/sdk';
import { BeneficiaryType } from '@rahataid/sdk/enums';
import { PrismaService } from '@rumsan/prisma';
import axios from 'axios';
import { UUID } from 'crypto';
import { tap, timeout } from 'rxjs';
import { ERC2771FORWARDER } from '../utils/contracts';
import { createContractSigner } from '../utils/web3';
import { aaActions, beneficiaryActions, c2cActions, cvaActions, elActions, settingActions, vendorActions } from './actions';
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

  async updateStatus(uuid: UUID, data: UpdateProjectStatusDto) {
    return this.prisma.project.update({
      where: {
        uuid,
      },
      data
    });
  }

  async remove(uuid: UUID) {
    return this.prisma.project.delete({
      where: {
        uuid,
      },
    });
  }

  async createTemplate(template: { name: string, media: string }) {
    try {
      const twilioContentApi = `https://content.twilio.com/v1/Content`;
      const templateData = {
        friendly_name: template.name,
        language: 'en',
        types: {
          'twilio/media': {
            body: "Use qr code for walletaddress:",
            media: [template.media]

          },
        },
      };

      const response = await axios.post(twilioContentApi, templateData, {
        headers: {
          'Content-Type': 'application/json',
        },
        auth: {
          username: process.env.TWILIO_SID || '',
          password: process.env.TWILIO_SECRET,
        },
      });

      if (response.status === 201) {
        await this.sendTemplateApprovalRequest({
          sid: response.data.sid,
          name: template.name,
        });
      }

      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async sendTemplateApprovalRequest(template: { sid: string; name: string }) {
    try {
      const twilioContentApi = `https://content.twilio.com/v1/Content/${template.sid}/ApprovalRequests/whatsapp`;
      const requestData = {
        name: template.name.toLowerCase().replace(/\s+/g, '_'),
        category: 'UTILITY',
      };

      const response = await axios.post(twilioContentApi, requestData, {
        headers: {
          'Content-Type': 'application/json',
        },
        auth: {
          username: process.env.TWILIO_SID,
          password: process.env.TWILIO_SECRET,
        },
      });

      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async sendCommand(cmd, payload, timeoutValue = MS_TIMEOUT, client: ClientProxy) {

    return client.send(cmd, payload).pipe(
      timeout(timeoutValue),
      tap((response) => {

        // if (
        //   response?.insertedData?.some((res) => res?.walletAddress) &&
        //   response?.cmd === BeneficiaryJobs.BULK_REFER_TO_PROJECT
        // ) {
        // axios.post(process.env.MESSAGE_SENDER_API + '/send-qr', response)
        //   .then((data) => {
        //     console.log("SUCCESS", data)
        //   })
        //   .catch((error) => {
        //     console.error(error);
        //   });
        //generate qr code
        // response?.insertedData?.map(async (res) => {
        //   const buffer = await generateQRCode(res?.walletAddress)
        //   console.log(buffer)
        //   const config = {
        //     file: buffer,
        //     mimeType: 'png',
        //     fileName: res?.walletAddress + '.png',
        //     folderName: process.env.AWS_FOLDER_NAME,
        //     rootFolder: process.env.AWS_ROOT_FOLDER_NAME,
        //   };
        //   const url = await uploadFileToS3(
        //     config.file,
        //     config.mimeType,
        //     config.folderName,
        //     config.fileName,
        //     config.rootFolder
        //   )
        //   const mediaUrl = `https://${process.env.AWS_BUCKET}.s3.us-east-1.amazonaws.com/${config.rootFolder}/${config.fileName}/${url.fileNameHash}`;
        //   ;
        //   this.createTemplate({
        //     name: `qr${res?.walletAddress.slice(1, 7)}`,
        //     media: mediaUrl
        //   })

        // })

        // }
        // send whatsapp message after added referal beneficiary to project
        if (
          response?.insertedData?.some((res) => res?.walletAddress) &&
          response?.cmd === BeneficiaryJobs.BULK_REFER_TO_PROJECT &&
          payload?.dto?.type === BeneficiaryType.REFERRED
        ) {
          this.eventEmitter.emit(
            ProjectEvents.BENEFICIARY_ADDED_TO_PROJECT,
            payload.dto
          );
        }
        //send message to all admin
        if (
          response?.id &&
          cmd?.cmd === ProjectJobs.REQUEST_REDEMPTION
        ) {
          this.eventEmitter.emit(
            ProjectEvents.REQUEST_REDEMPTION
          );
        }
        if (
          response?.vendordata?.length > 0 &&
          cmd?.cmd === ProjectJobs.UPDATE_REDEMPTION
        ) {
          this.eventEmitter.emit(
            ProjectEvents.UPDATE_REDEMPTION,
            response.vendordata

          );
        }
      })
    );
  }

  async executeMetaTxRequest(params: any) {
    const { metaTxRequest } = params;
    const forwarderContract = await createContractSigner(
      ERC2771FORWARDER,
      process.env.ERC2771_FORWARDER_ADDRESS
    );

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
    //Note: This is a temporary solution to handle metaTx actions
    const metaTxActions = {
      [MS_ACTIONS.ELPROJECT.REDEEM_VOUCHER]: async () => await this.executeMetaTxRequest(payload),
      [MS_ACTIONS.ELPROJECT.PROCESS_OTP]: async () => await this.executeMetaTxRequest(payload),
      [MS_ACTIONS.ELPROJECT.ASSIGN_DISCOUNT_VOUCHER]: async () => await this.executeMetaTxRequest(payload),
      [MS_ACTIONS.ELPROJECT.REQUEST_REDEMPTION]: async () => await this.executeMetaTxRequest(payload),
    };

    const actions = {
      ...elActions,
      ...aaActions,
      ...beneficiaryActions,
      ...vendorActions,
      ...settingActions,
      ...metaTxActions,
      ...c2cActions,
      ...cvaActions
    };

    const actionFunc = actions[action];
    if (!actionFunc) {
      throw new Error('Please provide a valid action!');
    }
    return await actionFunc(uuid, payload, (...args) => this.sendCommand(args[0], args[1], args[2], this.client));
  }
}

