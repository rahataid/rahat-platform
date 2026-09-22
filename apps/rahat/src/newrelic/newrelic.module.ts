import { Global, Module, Logger, OnModuleInit } from '@nestjs/common';
import { NewRelicService } from './newrelic.service';

@Global()
@Module({
  providers: [NewRelicService],
  exports: [NewRelicService],
})
export class NewRelicModule implements OnModuleInit {
  private readonly logger = new Logger(NewRelicModule.name);

  constructor(private newRelicService: NewRelicService) {}

  onModuleInit() {
    const config = this.newRelicService.getConfig();
    if (this.newRelicService.isEnabled()) {
      this.logger.log('✅ New Relic monitoring is active');
      this.logger.debug(`Configuration: App="${config.appName}", LogLevel="${config.logLevel}"`);
    } else {
      this.logger.warn('⚠️ New Relic monitoring is disabled - set NEW_RELIC_LICENSE_KEY to enable');
    }
  }
}
