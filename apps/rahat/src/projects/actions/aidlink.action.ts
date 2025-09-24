// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { BeneficiaryJobs, MS_ACTIONS } from '@rahataid/sdk';
import { ProjectActionFunc } from '@rahataid/sdk/project/project.types';

export const aidLinkActions: ProjectActionFunc = {
    [MS_ACTIONS.AIDLINKProject.GET_SAFE_OWNER]: (uuid, payload, sendCommand) =>
        sendCommand(
            {
                cmd: BeneficiaryJobs.GET_SAFE_OWNER,
                uuid,
            },
            payload,
            50000
        ),
    [MS_ACTIONS.AIDLINKProject.GET_BEN_REPORTING_LOGS]: (
        uuid,
        payload,
        sendCommand
    ) =>
        sendCommand(
            {
                cmd: BeneficiaryJobs.GET_BEN_REPORTING_LOGS,
            },
            { projectId: uuid, ...payload },
            50000
        ),
    [MS_ACTIONS.AIDLINKProject.GET_OFFRAMP_DETAILS]: (
        uuid,
        payload,
        sendCommand
    ) =>
        sendCommand(
            {
                cmd: BeneficiaryJobs.GET_OFFRAMP_DETAILS,
                uuid,
            },
            { projectId: uuid, ...payload },
            50000
        ),
    [MS_ACTIONS.AIDLINKProject.GET_BEN_DISBURSEMENT_DETAILS]: (
        uuid,
        payload,
        sendCommand
    ) =>
        sendCommand(
            {
                cmd: BeneficiaryJobs.GET_BEN_DISBURSEMENT,
                uuid,
            },
            { projectId: uuid, ...payload },
            50000
        ),
    [MS_ACTIONS.AIDLINKProject.GET_DISBURSEMENT_SAFE_CHART]: (
        uuid,
        payload,
        sendCommand
    ) =>
        sendCommand(
            {
                cmd: BeneficiaryJobs.DISBURSEMENT_BALANCE_CHART,
                uuid,
            },
            { projectId: uuid, ...payload },
            50000
        ),
};
