import { MS_ACTIONS } from '@rahataid/sdk';
import { UUID } from 'crypto';
import { beneficiaryActions, settingActions, vendorActions } from './common.action';

describe('project-scoped common actions', () => {
  const projectId: UUID = '11111111-1111-4111-8111-111111111111';
  const otherProjectId: UUID = '22222222-2222-4222-8222-222222222222';
  const actions = [
    beneficiaryActions[MS_ACTIONS.BENEFICIARY.ASSGIN_TO_PROJECT],
    beneficiaryActions[MS_ACTIONS.BENEFICIARY.ASSGIN_GROUP_TO_PROJECT],
    beneficiaryActions[MS_ACTIONS.BENEFICIARY.BULK_ASSIGN_TO_PROJECT],
    beneficiaryActions[MS_ACTIONS.BENEFICIARY.LIST_BY_PROJECT],
    beneficiaryActions[MS_ACTIONS.BENEFICIARY.GET_ONE_BENEFICARY],
    beneficiaryActions[MS_ACTIONS.BENEFICIARY.LIST_FULL_DATA_BY_PROJECT],
    beneficiaryActions[MS_ACTIONS.BENEFICIARY.GET_PROJECT_SPECIFIC],
    vendorActions[MS_ACTIONS.VENDOR.ASSIGN_TO_PROJECT],
    vendorActions[MS_ACTIONS.VENDOR.LIST_BY_PROJECT],
    vendorActions[MS_ACTIONS.VENDOR.GET_BY_UUID],
    settingActions[MS_ACTIONS.SETTINGS.GET],
  ];

  it.each(actions)('uses the route project ID instead of the payload project ID', async (action) => {
    const sendCommand = jest.fn().mockResolvedValue('response');
    const payload = { projectId: otherProjectId, filter: 'value' };

    await expect(action(projectId, payload, sendCommand)).resolves.toBe('response');

    expect(sendCommand).toHaveBeenCalledWith(
      expect.any(Object),
      { projectId, filter: 'value' }
    );
    expect(payload.projectId).toBe(otherProjectId);
  });
});
