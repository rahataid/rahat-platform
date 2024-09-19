
import {
    MS_ACTIONS
} from '@rahataid/sdk';
import { ProjectActionFunc } from '@rahataid/sdk/project/project.types';

const JOBS = {
    CHW: {
        CREATE: 'rahat.jobs.chw.create',
        LIST: 'rahat.jobs.chw.list',
        GET: 'rahat.jobs.chw.get',
        UPDATE: 'rahat.jobs.chw.update',
    }
}

export const combodiaActions: ProjectActionFunc = {

    [MS_ACTIONS.CHW.CREATE]: (uuid, payload, sendCommand) =>
        sendCommand(
            { cmd: JOBS.CHW.CREATE, uuid },
            payload),

};
