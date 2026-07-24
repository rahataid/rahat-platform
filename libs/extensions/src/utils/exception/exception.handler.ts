import { HttpException, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ExceptionResponse } from '@rumsan/sdk/types';

export class ExceptionHandler {
  static logger = new Logger(ExceptionHandler?.name);
  private static isObjectWithErrors(
    value: string | object
  ): value is { errors: any[] } {
    return typeof value === 'object' && value !== null && 'errors' in value;
  }

  static handleHttpException(
    exception: HttpException,
    responseData: ExceptionResponse,
    response: any
  ): ExceptionResponse {
    const exceptionResponse = exception?.getResponse();
    if (exceptionResponse !== null) {
      responseData.meta = exceptionResponse;
    } else {
      responseData.meta = response?.errors ?? '';
    }

    responseData.name = exception?.name;
    responseData.statusCode = exception?.getStatus();

    let message: any = exception?.message;
    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (exceptionResponse && typeof exceptionResponse === 'object') {
      const responseMessage = (exceptionResponse as any).message;
      if (Array.isArray(responseMessage)) {
        message = responseMessage.join(', ');
      } else if (typeof responseMessage === 'string') {
        message = responseMessage;
      }
    }
    responseData.message = message;
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
    responseData.statusCode = 400;
  }

  static handleGenericError(
    exception: Error,
    responseData: ExceptionResponse
  ): ExceptionResponse {
    console.log({ stack: exception?.stack }, exception.message);
    responseData.name = exception?.name;
    responseData.message = exception?.message;
    responseData.group = 'General Error';
    responseData.meta = exception?.stack;

    this.logger.error(responseData?.message);

    return responseData;
  }
}
