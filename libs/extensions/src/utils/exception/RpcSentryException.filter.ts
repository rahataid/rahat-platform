import { ArgumentsHost, Catch } from '@nestjs/common';
import { BaseRpcExceptionFilter } from '@nestjs/microservices';
import * as Sentry from '@sentry/nestjs';

// The HTTP global filter does not run for the Redis microservice, so errors
// thrown in message handlers would otherwise never reach Sentry. Reports the
// error, then lets Nest's default RPC handling reply to the caller as before.
@Catch()
export class RpcSentryExceptionFilter extends BaseRpcExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    Sentry.captureException(exception, { tags: { area: 'microservice-rpc' } });
    return super.catch(exception, host);
  }
}
