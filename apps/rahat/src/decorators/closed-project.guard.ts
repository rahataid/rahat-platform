import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '@rumsan/prisma';
import { CLOSED_PROJECT_ALLOWED_ACTIONS } from '../projects/actions/closed-project-allowed.action';

@Injectable()
export class ClosedProjectGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const uuid = request.params?.uuid;
    if (!uuid) return true;

    const action = request.body?.action;
    if (!action) return true;

    const project = await this.prisma.project.findUnique({
      where: { uuid },
      select: { status: true },
    });

    if (!project) {
      throw new BadRequestException('Project not found');
    }

    if (project.status !== 'CLOSED') return true;

    if (!CLOSED_PROJECT_ALLOWED_ACTIONS.has(action)) {
      throw new ForbiddenException(
        'Project is closed. Only read actions are allowed.'
      );
    }

    return true;
  }
}
