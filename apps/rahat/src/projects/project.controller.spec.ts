import { Test } from '@nestjs/testing';
import { AbilitiesGuard, JwtGuard } from '@rumsan/user';
import { UUID } from 'crypto';
import { Request } from 'express';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';

describe('ProjectController project actions', () => {
  it('uses the route UUID when the body also contains a UUID', async () => {
    const projectService = { handleProjectActions: jest.fn().mockResolvedValue('response') };
    const module = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [
        { provide: ProjectService, useValue: projectService },
        { provide: 'RAHAT_CLIENT', useValue: {} },
        { provide: 'BEN_CLIENT', useValue: {} },
      ],
    })
      .overrideGuard(AbilitiesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .compile();
    const controller = module.get(ProjectController);
    const routeUuid: UUID = '11111111-1111-4111-8111-111111111111';
    const data = {
      uuid: '22222222-2222-4222-8222-222222222222',
      action: 'example',
      payload: {},
      trigger: {},
    };
    const request = { user: { id: 'user' } } as Request;

    await expect(controller.projectActions(routeUuid, data, request)).resolves.toBe('response');
    expect(projectService.handleProjectActions).toHaveBeenCalledWith({
      ...data,
      uuid: routeUuid,
      user: request.user,
    });
  });
});
