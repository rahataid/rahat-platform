import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AAJobs, MS_ACTIONS } from '@rahataid/sdk';
import { of } from 'rxjs';
import { aaActions } from './aa.action';

describe('AA payout actions', () => {
  const projectUuid = '11111111-1111-4111-8111-111111111111';
  const payoutUuid = '22222222-2222-4222-8222-222222222222';
  const cancelPayout = aaActions[MS_ACTIONS.AAPROJECT.PAYOUT.CANCEL_PAYOUT];

  it('updates eligible pending payouts to cancelled and returns the update', async () => {
    const updatedPayout = { uuid: payoutUuid, status: 'CANCELLED' };
    const sendCommand = jest
      .fn()
      .mockResolvedValueOnce(
        of({
          uuid: payoutUuid,
          status: 'PENDING',
          isPayoutTriggered: false,
        })
      )
      .mockResolvedValueOnce(of(updatedPayout));

    await expect(
      cancelPayout(projectUuid, { uuid: payoutUuid }, sendCommand)
    ).resolves.toEqual(updatedPayout);

    expect(sendCommand).toHaveBeenNthCalledWith(
      1,
      { cmd: AAJobs.PAYOUT.GET, uuid: projectUuid },
      { uuid: payoutUuid }
    );
    expect(sendCommand).toHaveBeenNthCalledWith(
      2,
      { cmd: AAJobs.PAYOUT.UPDATE, uuid: projectUuid },
      { uuid: payoutUuid, status: 'CANCELLED' }
    );
  });

  it('rejects a missing or invalid payout identifier', async () => {
    const sendCommand = jest.fn();

    await expect(
      cancelPayout(projectUuid, { uuid: 'not-a-uuid' }, sendCommand)
    ).rejects.toThrow(BadRequestException);
    expect(sendCommand).not.toHaveBeenCalled();
  });

  it('returns not found when the payout does not exist', async () => {
    const sendCommand = jest.fn().mockResolvedValueOnce(of(null));

    await expect(
      cancelPayout(projectUuid, { uuid: payoutUuid }, sendCommand)
    ).rejects.toThrow(NotFoundException);
    expect(sendCommand).toHaveBeenCalledTimes(1);
  });

  it.each([
    { status: 'COMPLETED', isPayoutTriggered: false },
    { status: 'PENDING', isPayoutTriggered: true },
  ])('rejects ineligible payouts: %o', async (payout) => {
    const sendCommand = jest
      .fn()
      .mockResolvedValueOnce(of({ uuid: payoutUuid, ...payout }));

    await expect(
      cancelPayout(projectUuid, { uuid: payoutUuid }, sendCommand)
    ).rejects.toThrow(BadRequestException);
    expect(sendCommand).toHaveBeenCalledTimes(1);
  });
});
