import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {

    console.log(exception)

    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.error?.statusCode || 500;
    const exceptionMessage = exception.message || 'Internal server error';

    response
      .status(status)
      .json({
        statusCode: 400,
        message: exceptionMessage,
      });
  }
}