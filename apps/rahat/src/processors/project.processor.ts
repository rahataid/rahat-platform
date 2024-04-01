import { Process, Processor } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { Project } from '@prisma/client';
import { BQUEUE, ProjectJobs } from '@rahataid/sdk';
import { SettingsService } from '@rumsan/settings';
import { Job } from 'bull';

@Processor(BQUEUE.RAHAT_PROJECT)
export class ProjectProcessor {
  private readonly logger = new Logger(ProjectProcessor.name);

  constructor(
    @Inject('DEPLOYMENT_CLIENT') private readonly client: ClientProxy,
    private readonly configService: ConfigService
  ) { }

  @Process(ProjectJobs.PROJECT_CREATE)
  async processProjectCreation(job: Job<Project>) {
    try {
      this.logger.log(
        '######## SENDING PROJECT CREATION TASK TO THE WORKER ###########'
      );

      const environment = this.configService.get<string>('ENVIRONMENT')
      const formattedProjectName = job.data.name.trim().split(/\s+/).join('_');
      const dbName = `rahat_${formattedProjectName}`;
      const projectId = job.data.uuid;

      if (environment === 'local') {
        const projectPath = this.configService.get<string>('EL_PROJECT_DIR')
        const localPayload = {
          environmentVariables: {
            environment,
            dbName,
            projectId,
            projectPath
          }
        }
        this.logger.log("Payload sent for local deployment.")
        return this.client.emit({ cmd: 'project.create' }, localPayload);
      }

      const env = this.getProjectVariables();
      env['DB_NAME'] = dbName;
      env['DATABASE_URL'] = `postgresql://${env['DB_USERNAME']}:${env['DB_PASSWORD']}@${env['DB_HOST']}:${env['DB_PORT']}/${dbName}?schema=public`;
      env['PROJECT_ID'] = projectId;

      const dockerImage = env['DOCKER_IMAGE'];

      delete env['DOCKER_IMAGE'];

      const dockerConfig = {
        projectId: projectId,
        containerName: `${formattedProjectName}_container`,
        serviceName: `${formattedProjectName}_service`,
        imageName: dockerImage,
      };

      const workerPayload = {
        environmentVariables: env,
        dockerConfig,
      };

      return this.client.emit({ cmd: 'project.create' }, workerPayload);
      // remaining setup scripts
    } catch (err) {
      this.logger.error(err);
      // emit ws message to connected client
    }
  }

  private getProjectVariables() {
    return {
      PRIVATE_KEY: SettingsService.get('EL.PRIVATE_KEY'),
      REDIS_HOST: SettingsService.get('EL.REDIS_HOST'),
      REDIS_PORT: SettingsService.get('EL.REDIS_PORT'),
      REDIS_PASSWORD: SettingsService.get('EL.REDIS_PASSWORD'),
      DB_HOST: SettingsService.get('EL.DB_HOST'),
      DB_PORT: SettingsService.get('EL.DB_PORT'),
      DB_USERNAME: SettingsService.get('EL.DB_USERNAME'),
      DB_PASSWORD: SettingsService.get('EL.DB_PASSWORD'),
      DEPLOYER_PRIVATE_KEY: SettingsService.get('EL.DEPLOYER_PRIVATE_KEY'),
      ADMIN_PRIVATE_KEY: SettingsService.get('EL.ADMIN_PRIVATE_KEY'),
      VENDOR_PRIVATE_KEY: SettingsService.get('EL.VENDOR_PRIVATE_KEY'),
      RAHAT_ADMIN_PRIVATE_KEY: SettingsService.get(
        'EL.RAHAT_ADMIN_PRIVATE_KEY'
      ),
      VENDOR_WALLET: SettingsService.get('EL.VENDOR_WALLET'),
      ENROLLED_BENEFICIARY: SettingsService.get('EL.ENROLLED_BENEFICIARY'),
      NETWORK_PROVIDER: SettingsService.get('EL.NETWORK_PROVIDER'),
      NETWORK_ID: SettingsService.get('EL.NETWORK_ID'),
      CHAIN_NAME: SettingsService.get('EL.CHAIN_NAME'),
      CHAIN_ID: SettingsService.get('EL.CHAIN_ID'),
      CURRENCY_NAME: SettingsService.get('EL.CURRENCY_NAME'),
      CURRENCY_SYMBOL: SettingsService.get('EL.CURRENCY_SYMBOL'),
      DOCKER_IMAGE: SettingsService.get('EL.DOCKER_IMAGE'),
    };
  }
}
