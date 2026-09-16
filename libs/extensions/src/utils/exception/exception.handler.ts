import { HttpException, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ExceptionResponse } from '@rumsan/sdk/types';

export class ExceptionHandler {
  static logger = new Logger(ExceptionHandler?.name);
  private static isObjectWithErrors(value: string | object): value is { errors: any[] } {
    return typeof value === 'object' && value !== null && 'errors' in value;
  }

  static handleHttpException(
    exception: HttpException,
    responseData: ExceptionResponse,
    response: any
  ): ExceptionResponse {
    console.log(
      exception.getResponse()
    )
    const exceptionResponse = exception?.getResponse();
    if (exceptionResponse !== null) {
      responseData.meta = exceptionResponse;
    } else {
      responseData.meta = response?.errors ?? '';
    }

    responseData.name = exception?.name;
    responseData.statusCode = exception?.getStatus();
    responseData.message = exception?.message;
    responseData.group = 'HTTP';

    // preserve translation code/params from the HTTP exception's payload,
    // e.g. new BadRequestException({ message, code, params })
    if (exceptionResponse && typeof exceptionResponse === 'object') {
      (responseData as any).code = (exceptionResponse as any).code;
      (responseData as any).params = (exceptionResponse as any).params;
    }

    console.log(responseData.message)
    this.logger.error(responseData?.message);

    return responseData;
  }

  static handleRpcException(
    exception: RpcException,
    responseData: ExceptionResponse
  ) {
    responseData.name = exception?.name;
    responseData.message = exception?.message;
    responseData.group = 'RPC';

    // preserve translation code/params from the microservice's error payload,
    // e.g. new RpcException({ message, code, params })
    const err =
      typeof exception?.getError === 'function' ? exception.getError() : undefined;
    if (err && typeof err === 'object') {
      (responseData as any).code = (err as any).code;
      (responseData as any).params = (err as any).params;
    }

    this.logger.error(responseData?.message);

    return responseData;
  }

  static handleMicroserviceError(
    exception: any,
    responseData: ExceptionResponse
  ) {
    responseData.name = 'Microservice';
    responseData.message = exception.message;
    responseData.group = 'Microservice';
    responseData.statusCode = 400;
    // errors crossing the microservice transport boundary arrive as plain
    // objects, not RpcException instances -- forward code/params if present
    (responseData as any).code = exception?.code;
    (responseData as any).params = exception?.params;
  }

  static handleGenericError(
    exception: Error,
    responseData: ExceptionResponse
  ): ExceptionResponse {
    console.log({ stack: exception?.stack }, exception.message)
    responseData.name = exception?.name;
    responseData.message = exception?.message;
    responseData.group = 'General Error';
    responseData.meta = exception?.stack;

    this.logger.error(responseData?.message);

    return responseData;
  }
}
