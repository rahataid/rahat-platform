import { ArgumentMetadata, ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, PipeTransform } from "@nestjs/common";
import { BaseRpcExceptionFilter, RpcException } from "@nestjs/microservices";
import { ExceptionResponse } from "@rahataid/sdk/types";
import { Observable, throwError } from "rxjs";

@Catch(RpcException, HttpException)
export class CustomExceptionFilter  extends BaseRpcExceptionFilter implements PipeTransform<any>, ExceptionFilter{
    transform(value: string, {metatype}: ArgumentMetadata) {
        console.log({value})
        return value;
    }
    catch(exception: any, host: ArgumentsHost): Observable<any> {
        const ctx = host?.switchToHttp();
        const response = ctx?.getResponse();
        const request = ctx?.getRequest()

        console.log({ctx})

        const responseData: ExceptionResponse = {
            name: 'DEFAULT',    
            success: false,
        meta: {},
        group: '',
        message:
        'Our server is not happy. It threw an error. Please try again or contact support.' ||
        '',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        sourceModule: null,
        type: 'ERROR',
        timestamp: new Date().getTime(),
        path: request?.url,
        }


        if (exception instanceof RpcException) {
                  console.log(`first`)
                } else if (exception instanceof HttpException) {
                  console.log(`Second`)
                } 
              
   
        response.status(responseData?.statusCode).send(responseData);

        return throwError(() => exception.getError());
    }

}

// // custom-exception.filter.ts

// import { ArgumentsHost, Catch, HttpException, RpcExceptionFilter } from '@nestjs/common';
// import { RpcException } from '@nestjs/microservices';
// import { Observable, throwError } from 'rxjs';

// @Catch(RpcException, HttpException)
// export class CustomExceptionFilter implements RpcExceptionFilter<RpcException> {
//   catch(exception: RpcException | HttpException, host: ArgumentsHost): Observable<any> {
//     const ctx = host.switchToHttp();
//     const response = ctx.getResponse();

//     let status;
//     let message;

//     if (exception instanceof RpcException) {
//       status = exception.name;
//       message = exception.message;
//       console.log(`first`)
//     } else if (exception instanceof HttpException) {
//       status = exception.getStatus();
//       message = exception.message;
//       console.log(`Second`)
//     } else {
//       status = 500;
//       message = 'Internal server error';
//     }

//     response.status(status).json({
//       statusCode: status,
//       message: message,
//     });

//     return throwError(exception);
//   }
// }
