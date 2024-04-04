import { HttpException, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ExceptionResponse } from '@rumsan/sdk/types';

export class ExceptionHandler {
  static logger = new Logger(ExceptionHandler?.name);
  private static isObjectWithErrors(value: any): value is { errors: any[] } {
    return typeof value === 'object' && value !== null && 'errors' in value;
  }

  static handleHttpException(
    exception: HttpException,
    responseData: ExceptionResponse,
    response: any
  ): ExceptionResponse {
    const exceptionResponse = exception?.getResponse();
    if (ExceptionHandler.isObjectWithErrors(exceptionResponse)) {
      responseData.meta = exceptionResponse.errors ?? '';
    } else {
      responseData.meta = [response?.errors ?? ''];
    }

    responseData.name = exception?.name;
    responseData.statusCode = exception?.getStatus();
    responseData.message = exception?.message;
    responseData.group = 'HTTP';

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
    responseData.statusCode = exception?.error?.statusCode;
  }

  static handleGenericError(
    exception: Error,
    responseData: ExceptionResponse
  ): ExceptionResponse {
    responseData.name = exception?.name;
    responseData.message = exception?.message;
    responseData.group = 'General Error';

    this.logger.error(responseData?.message);

    return responseData;
  }
}
