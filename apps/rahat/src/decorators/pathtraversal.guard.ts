import {
    BadRequestException,
    CanActivate,
    ExecutionContext,
    Injectable,
} from '@nestjs/common';

@Injectable()
export class PathTraversalGuard implements CanActivate {
    private readonly forbiddenPatterns = [
        /\.\.\//,               // ../
        /\\\.\./,               // \..
        /%2e%2e%2f/i,           // URL encoded ../
        /%252e%252e%252f/i,     // double URL encoded ../
        /\.\.%c0%af/i,          // Unicode encoded ../
        /%u2216/i,              // Unicode variant
    ];

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();

        // Check all params
        for (const key in request.params) {
            const value = request.params[key];
            if (this.isMalicious(value)) {
                throw new BadRequestException(
                    `Invalid parameter value detected for '${key}'`,
                );
            }
        }

        return true;
    }

    private isMalicious(value: string): boolean {
        if (!value) return false;

        return this.forbiddenPatterns.some((pattern) => pattern.test(value));
    }
}
